import crypto from "node:crypto";
import Joi from "joi";
import { env } from "./config/env.js";
import { sequelize, selectOne } from "./db.js";
import templates from "./templates.js";
import { optedInAdmins } from "./preferences.js";
import { contacts, staffNames } from "./clients.js";
import { kick } from "./dispatcher.js";
import AppError from "./utils/AppError.js";

// One entry point for the queue consumer and POST /internal/notifications/events.
// A handler turns an event into requests { key, template, recipient, vars, subjectId }; insertRows makes the rows.
// The idempotency key makes a redelivered event a no-op.

const ist = (iso) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
const STATUS_WORDS = { PAUSED: "paused", MAINTENANCE: "under maintenance" };
const statusWord = (status) => STATUS_WORDS[status] ?? String(status).toLowerCase();

// Warehouse alerts go to super admins only: a store manager sees their own store, not the others (Task 193).
const SUPER_ADMINS = ["SUPER_ADMIN"];
const ROLE_WORDS = { SUPER_ADMIN: "super admin", ADMIN: "store manager", OPS_STAFF: "ops staff" };
const LOCATION_WORDS = { address: "Address", city: "City", state: "State", country: "Country", latitude: "Latitude", longitude: "Longitude", pincode: "Pincode" };

// "Pardeep Sahani (store manager)". A failed name lookup falls back to the id rather than losing the alert.
async function changedByText({ changedBy, changedByRole }) {
  if (!changedBy) return "the system";
  const name = await staffNames([changedBy]).then((names) => names.get(String(changedBy))).catch(() => null);
  const role = ROLE_WORDS[changedByRole];
  return `${name || `staff #${changedBy}`}${role ? ` (${role})` : ""}`;
}
const WHO = {
  changedBy: Joi.alternatives(Joi.number(), Joi.string().max(40)).allow(null),
  changedByRole: Joi.string().max(30).allow(null),
};

const toAdmins = (admins, envelope, template, vars, subjectId) =>
  admins.map((admin) => ({ key: `${envelope.eventId}:${template}:EMAIL:u${admin.id}`, template, recipient: admin, vars, subjectId }));

// A person with an account is texted on their account mobile, read now (design D8); an unknown or inactive user
// becomes a SKIPPED NO_ADDRESS row. The event's own fields are the template's variables.
async function toUser(envelope, template, userId, subjectId) {
  const [user] = await contacts({ ids: [Number(userId)] });
  return { key: `${envelope.eventId}:${template}:SMS:u${userId}`, template, recipient: user ?? { id: userId }, vars: envelope.data, subjectId };
}

// Store contacts and invitees travel by value; the key carries a piece of the number's hash, never the number.
const toPhone = (envelope, template, phone, subjectId) => ({
  key: `${envelope.eventId}:${template}:SMS:h${hashDestination(phone).slice(0, 12)}`,
  template, recipient: { phone }, vars: envelope.data, subjectId,
});

// A phone sent by value (a store's contact is free text in inventory-service): an Indian mobile, kept as its 10
// digits so one number always hashes the same for the rate limits.
const PHONE = Joi.string().max(20).custom((value, helpers) => {
  const digits = value.replace(/\D/g, "");
  return /^(91|0)?[6-9]\d{9}$/.test(digits) ? digits.slice(-10) : helpers.error("any.invalid");
});
const ID = Joi.alternatives(Joi.number().integer().positive(), Joi.string().max(64));

// The new status picks the customer's text (design 5.4). Any other status is an internal step, or happens while
// the customer is on the checkout screen.
export const ORDER_TEXTS = {
  PLACED: "order.placed",
  AWAITING_CUSTOMER_CONFIRMATION: "order.needs_confirmation",
  OUT_FOR_DELIVERY: "order.out_for_delivery",
  DELIVERED: "order.delivered",
  CANCELLED: "order.cancelled",
  DELIVERY_FAILED: "order.delivery_failed",
};

// A step of a customer's return (order-service's history row with returnStep): one text to the customer, worded
// here, and on a new ask one to the store. Each value fits the 30 characters a variable may use.
const rupees = (value) => {
  const amount = Number(value ?? 0);
  return `Rs ${amount.toLocaleString("en-IN", Number.isInteger(amount) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
export const RETURN_WORDS = {
  REQUESTED: () => "request received",
  APPROVED: () => "approved",
  REJECTED: () => "doesn't meet our return terms",
  PICKUP_ASSIGNED: () => "a rider will collect it",
  REFUND_SENT: (amount) => `${rupees(amount)} refunded`,
  REFUND_DUE: (amount) => `refund of ${rupees(amount)} due`,
};

async function returnTexts(data) {
  const words = RETURN_WORDS[data.returnStep];
  if (!words) return [];
  const [customer] = await contacts({ ids: [data.userId] });
  const requests = [{
    key: `osh:${data.historyId}:order.return_update:SMS:u${data.userId}`,
    template: "order.return_update",
    recipient: customer ?? { id: data.userId },
    vars: { orderNumber: data.orderNumber, update: words(data.returnAmount) },
    subjectId: String(data.orderId),
  }];
  // The store's contact is free text in inventory-service: one that isn't a mobile gets no text.
  const store = data.returnStep === "REQUESTED" && data.storePhone ? PHONE.validate(data.storePhone) : null;
  if (store && !store.error) {
    requests.push({
      key: `osh:${data.historyId}:store.return_requested:SMS:h${hashDestination(store.value).slice(0, 12)}`,
      template: "store.return_requested",
      recipient: { phone: store.value },
      vars: { order: data.orderNumber },
      subjectId: String(data.orderId),
    });
  }
  return requests;
}

// The applicant's texts from delivery-service's review steps: one event type each, the same shape.
const applicantText = (template, vars) => ({
  schema: Joi.object({ applicationId: Joi.string().max(64).required(), userId: ID.required(), ref: ID.required(), ...vars }).unknown(true),
  run: async (envelope) => [await toUser(envelope, template, envelope.data.userId, envelope.data.applicationId)],
});

// Producers may add fields, so data schemas allow unknown keys; what we read must be there.
const handlers = {
  // The key comes from the status-history row, not the eventId: a republished change still makes one text.
  "order.status.changed": {
    schema: Joi.object({
      historyId: Joi.number().integer().positive().required(),
      orderId: Joi.number().integer().positive().required(),
      orderNumber: Joi.string().max(40).required(),
      userId: Joi.number().integer().positive().required(),
      newStatus: Joi.string().max(40).required(),
      changedBy: Joi.alternatives(Joi.number(), Joi.string().max(40)).allow(null),
      totalAmount: Joi.alternatives(Joi.number(), Joi.string().max(20)).allow(null),
    }).unknown(true),
    async run({ data }) {
      if (data.returnStep) return returnTexts(data);
      const template = ORDER_TEXTS[data.newStatus];
      if (!template) return [];
      if (data.newStatus === "CANCELLED" && String(data.changedBy) === String(data.userId)) return []; // they cancelled it themselves
      const [customer] = await contacts({ ids: [data.userId] });
      const total = Number(data.totalAmount ?? 0);
      const amount = total.toLocaleString("en-IN", Number.isInteger(total) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return [{
        key: `osh:${data.historyId}:${template}:SMS:u${data.userId}`,
        template,
        recipient: customer ?? { id: data.userId },
        vars: { orderNumber: data.orderNumber, orderId: data.orderId, amount },
        subjectId: String(data.orderId),
      }];
    },
  },

  "partner.application.invited": {
    schema: Joi.object({ applicationId: Joi.string().max(64).required(), phone: PHONE.required() }).unknown(true),
    run: async (envelope) => [toPhone(envelope, "partner.invite", envelope.data.phone, envelope.data.applicationId)],
  },
  "partner.application.changes_requested": applicantText("partner.changes"),
  "partner.application.reupload_requested": applicantText("partner.reupload", { doc: Joi.string().max(60).required() }),
  "partner.application.approved": applicantText("partner.approved", { name: Joi.string().max(60).required() }),
  "partner.application.rejected": applicantText("partner.rejected", { date: Joi.string().max(30).required() }),

  // To the store's pickup contact when a partner reports a failed drop; the last allowed attempt gets the other text.
  "delivery.attempt.failed": {
    schema: Joi.object({
      orderId: ID.required(),
      phone: PHONE.required(),
      attempt: Joi.number().integer().min(1).required(),
      maxAttempts: Joi.number().integer().min(1).required(),
      reason: Joi.string().max(300).required(),
    }).unknown(true),
    async run(envelope) {
      const { data } = envelope;
      const template = data.attempt >= data.maxAttempts ? "store.delivery_failed_final" : "store.delivery_failed";
      const vars = { order: data.orderId, n: data.attempt, max: data.maxAttempts, reason: data.reason };
      return [{ ...toPhone(envelope, template, data.phone, String(data.orderId)), vars }];
    },
  },

  // To the store's pickup contact, once, when a partner has held goods owed back to the store past the limit.
  "delivery.return.overdue": {
    schema: Joi.object({
      orderId: ID.required(),
      phone: PHONE.required(),
      partnerName: Joi.string().max(120).allow("", null),
      partnerPhone: Joi.string().max(20).allow("", null),
    }).unknown(true),
    async run(envelope) {
      const { data } = envelope;
      const vars = { order: data.orderId, partner: data.partnerName || "The partner", partnerPhone: data.partnerPhone || "-" };
      return [{ ...toPhone(envelope, "store.return_overdue", data.phone, String(data.orderId)), vars }];
    },
  },

  "warehouse.status.changed": {
    schema: Joi.object({
      warehouseId: Joi.number().integer().positive().required(),
      name: Joi.string().max(120).required(),
      oldStatus: Joi.string().max(30).allow(null),
      newStatus: Joi.string().max(30).required(),
      ...WHO,
    }).unknown(true),
    async run(envelope) {
      const { data } = envelope;
      // Pauses and maintenance are alerts, and so is reopening after one (a manager may reopen whoever closed it).
      // Going live from setup is not.
      const reopened = data.newStatus === "OPEN" && Boolean(STATUS_WORDS[data.oldStatus]);
      if (!STATUS_WORDS[data.newStatus] && !reopened) return [];
      const vars = {
        warehouseId: data.warehouseId,
        warehouseName: data.name,
        status: statusWord(data.newStatus),
        oldStatus: data.oldStatus ? statusWord(data.oldStatus) : "unknown",
        changedBy: await changedByText(data),
        when: ist(envelope.occurredAt),
      };
      return toAdmins(await optedInAdmins("warehousePauses", SUPER_ADMINS), envelope, "alert.warehouse_status", vars, String(data.warehouseId));
    },
  },

  // Only a store manager's change raises it (inventory-service skips the super admin's own edits).
  "warehouse.location.changed": {
    schema: Joi.object({
      warehouseId: Joi.number().integer().positive().required(),
      name: Joi.string().max(120).required(),
      changes: Joi.array().items(Joi.object({ field: Joi.string().max(30).required(), from: Joi.any(), to: Joi.any() })).min(1).max(10).required(),
      ...WHO,
    }).unknown(true),
    async run(envelope) {
      const { data } = envelope;
      const value = (v) => (v === null || v === undefined || v === "" ? "(empty)" : String(v).slice(0, 120));
      const vars = {
        warehouseId: data.warehouseId,
        warehouseName: data.name,
        changes: data.changes.map(({ field, from, to }) => `${LOCATION_WORDS[field] ?? field}: ${value(from)} -> ${value(to)}`).join("\n"),
        changedBy: await changedByText(data),
        when: ist(envelope.occurredAt),
      };
      return toAdmins(await optedInAdmins("warehousePauses", SUPER_ADMINS), envelope, "alert.warehouse_location", vars, String(data.warehouseId));
    },
  },

  "partner.application.submitted": {
    schema: Joi.object({
      applicationId: Joi.string().max(64).required(),
      refNo: Joi.alternatives(Joi.number().integer(), Joi.string().max(20)).required(),
      vehicleType: Joi.string().max(30).required(),
      userId: ID.required(),
    }).unknown(true),
    // The applicant's "received" text and one email per opted-in admin.
    async run(envelope) {
      const { data } = envelope;
      const vars = { applicationId: data.applicationId, refNo: data.refNo, vehicleType: data.vehicleType.toLowerCase() };
      const applicant = await toUser(envelope, "partner.received", data.userId, data.applicationId);
      return [
        { ...applicant, vars: { ref: data.refNo } },
        ...toAdmins(await optedInAdmins("partnerApplies"), envelope, "alert.partner_application", vars, data.applicationId),
      ];
    },
  },

  // The switch reads "Failed payments exceed 5/hour": count each failure once, alert once per 60 min.
  "payment.failed": {
    schema: Joi.object({ orderId: Joi.alternatives(Joi.number(), Joi.string().max(64)).required() }).unknown(true),
    async run(envelope) {
      await sequelize.query(
        `INSERT INTO notification_alert_hits (alert_key, source_key, occurred_at)
         VALUES ('payment_failures', :eventId, COALESCE(CAST(:occurredAt AS timestamptz), now())) ON CONFLICT DO NOTHING`,
        { replacements: { eventId: envelope.eventId, occurredAt: envelope.occurredAt ?? null } }
      );
      const { count, hour } = await selectOne(
        `SELECT count(*)::int AS count, to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD"T"HH24') AS hour
         FROM notification_alert_hits WHERE alert_key = 'payment_failures' AND occurred_at > now() - interval '60 minutes'`
      );
      if (count <= 5) return [];
      const recent = await selectOne(
        `SELECT 1 AS hit FROM notifications WHERE template_key = 'alert.payment_failures' AND created_at > now() - interval '60 minutes' LIMIT 1`
      );
      if (recent) return []; // the cooldown
      // Two consumers crossing the threshold together build the same hour key, so one email goes out.
      // ponytail: a race exactly on the hour boundary can send two; a one-row alert state fixes that if it matters.
      const admins = await optedInAdmins("failedPayments");
      return admins.map((admin) => ({
        key: `alert.payment_failures:${hour}:u${admin.id}:EMAIL`,
        template: "alert.payment_failures",
        recipient: admin,
        vars: { count, windowMinutes: 60 },
        subjectId: hour,
      }));
    },
  },
};

export const EVENT_TYPES = Object.keys(handlers);

const envelopeSchema = Joi.object({
  eventId: Joi.string().guid().required(),
  eventType: Joi.string().max(80).required(),
  version: Joi.number().integer().min(1).default(1),
  occurredAt: Joi.date().iso().raw(),
  data: Joi.object().required(),
}).unknown(true);

// Validation failures are 400s: the HTTP route returns them, the consumer acks them (a retry would fail the same way).
export async function handle(envelope) {
  const { error, value } = envelopeSchema.validate(envelope);
  if (error) throw new AppError(`Invalid event: ${error.message}`, 400);
  const handler = handlers[value.eventType];
  if (!handler) throw new AppError(`Unknown event type "${value.eventType}"`, 400);
  const data = handler.schema.validate(value.data);
  if (data.error) throw new AppError(`Invalid ${value.eventType}: ${data.error.message}`, 400);

  const requests = await handler.run({ ...value, data: data.value });
  return insertRows(requests, { sourceEventId: value.eventId });
}

export const hashDestination = (destination) =>
  crypto.createHmac("sha256", env.NOTIFICATION_HASH_KEY).update(destination.trim().toLowerCase()).digest("hex");

export function maskDestination(destination) {
  if (destination.includes("@")) {
    const [name, domain] = destination.split("@");
    return `${name.slice(0, 1)}***@${domain}`;
  }
  return `******${destination.slice(-4)}`;
}

// Texts to one number, counted from this table (design 5.5). Skipped rows don't count, so a blocked number recovers.
export const SMS_LIMITS = { hour: 10, day: 30 };

// ponytail: two inserts at the same moment can both pass, so a limit can be exceeded by one; a counter row per
// number makes it exact if that ever matters.
async function overSmsLimit(hash) {
  const { hour, day } = await selectOne(
    `SELECT count(*) FILTER (WHERE created_at > now() - interval '1 hour')::int AS hour, count(*)::int AS day
     FROM notifications
     WHERE destination_hash = :hash AND channel = 'SMS' AND status <> 'SKIPPED' AND created_at > now() - interval '1 day'`,
    { hash }
  );
  return hour >= SMS_LIMITS.hour || day >= SMS_LIMITS.day;
}

// Returns how many rows were new. A row that won't be sent (no address, rate limited) is kept as SKIPPED, so the log
// can answer "why didn't I get it?".
export async function insertRows(requests, { sourceEventId = null, createdBy = null } = {}) {
  let created = 0;
  for (const request of requests) {
    const template = templates[request.template];
    const destination = (template.channel === "EMAIL" ? request.recipient.email : request.recipient.phone) || null;
    const hash = destination && hashDestination(destination);
    const reason = !destination ? "NO_ADDRESS" : template.channel === "SMS" && (await overSmsLimit(hash)) ? "RATE_LIMITED" : null;
    const [rows] = await sequelize.query(
      `INSERT INTO notifications
         (idempotency_key, source_event_id, subject_id, template_key, channel, category, priority, recipient_user_id,
          destination, destination_masked, destination_hash, vars, status, reason, created_by)
       VALUES (:key, :sourceEventId, :subjectId, :template, :channel, :category, :priority, :userId,
          :destination, :masked, :hash, CAST(:vars AS jsonb), :status, :reason, :createdBy)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING id`,
      {
        replacements: {
          key: request.key,
          sourceEventId,
          subjectId: request.subjectId ?? null,
          template: request.template,
          channel: template.channel,
          category: template.category,
          priority: template.priority,
          userId: request.recipient.id ?? null,
          // A skipped row never sends, so it keeps only the masked copy and the hash.
          destination: reason ? null : destination,
          masked: destination && maskDestination(destination),
          hash,
          vars: JSON.stringify(request.vars),
          status: reason ? "SKIPPED" : "QUEUED",
          reason,
          createdBy,
        },
      }
    );
    created += rows.length;
  }
  if (created) kick();
  return created;
}
