// Run: docker compose exec -T notification-service node texts.check.js
// The Phase 2 check. First the texts themselves (pure): GSM-7 only, one segment, partner texts word for word as
// delivery-service sent them. Then the text events over HTTP against the running service and auth-service. Texts go to
// the console provider only; every row this check makes is tagged by its eventId and deleted before and after.
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { env } from "./src/config/env.js";
import { sequelize, select, selectOne } from "./src/db.js";
import templates, { render, cleanSmsValue, SMS_VALUE_MAX } from "./src/templates.js";
import { ORDER_TEXTS, SMS_LIMITS, RETURN_WORDS, hashDestination } from "./src/intake.js";

// --- The texts

const smsKeys = Object.keys(templates).filter((key) => templates[key].channel === "SMS");
assert.equal(smsKeys.length, 17, "7 customer texts and 10 partner and store texts");
// Values with a known size; order numbers are at most 19 characters (ORD-MVDFSUGC-4F7K2P), the rest get the full 30.
const ORDER_NO = "ORD-MVDFSUGC-4F7K2P";
const SHORT = { phone: "9876543210", n: "3", max: "3", order: ORDER_NO, orderNumber: ORDER_NO };
for (const key of smsKeys) {
  const { text } = templates[key];
  const fixed = text.replace(/\{\{\w+\}\}/g, "");
  assert.ok([...fixed].every((char) => char === " " || cleanSmsValue(char) === char), `${key} is GSM-7 only`);
  const names = [...text.matchAll(/\{\{(\w+)\}\}/g)].map(([, name]) => name).filter((name) => name !== "appUrl");
  const worst = Object.fromEntries(names.map((name) => [name, SHORT[name] ?? "W".repeat(SMS_VALUE_MAX)]));
  const length = render(key, worst).text.length;
  assert.ok(length <= 160, `${key} fits one segment with the longest values (${length})`);
}

// Word for word what delivery-service's notify.js printed.
const same = (key, vars, expected) => assert.equal(render(key, vars).text, expected, key);
same("partner.invite", { phone: "9876543210" },
  `Freshly: we've started your delivery partner application. Finish signing up here: ${env.APP_URL}/partner/apply?phone=9876543210`);
same("partner.received", { ref: 1001 }, "Freshly: we got your partner application FR-P-1001. We'll text you within 1-2 working days.");
same("partner.changes", { ref: 1001 }, "Freshly: we need a few changes to FR-P-1001. Open the app to see what.");
same("partner.reupload", { ref: 1001, doc: "Driving licence (back)" }, "Freshly: we need a new Driving licence (back) for FR-P-1001. Open the app to see what.");
same("partner.approved", { name: "Ravi" }, "Freshly: you're approved, Ravi! Sign in to go online.");
same("partner.rejected", { ref: 1001, date: "18 Jan 2027" }, "Freshly: we couldn't approve FR-P-1001. You can apply again after 18 Jan 2027.");
same("store.delivery_failed", { order: 75, n: 1, max: 3, reason: "Customer not reachable" },
  "Freshly: order #75 could not be delivered (attempt 1 of 3): Customer not reachable. Reassign or cancel it in the admin panel.");
same("store.delivery_failed_final", { order: 75, n: 3, max: 3, reason: "Other" },
  "Freshly: order #75 could not be delivered (attempt 3 of 3): Other. No attempts left, please cancel or return it.");
same("store.return_overdue", { order: 75, partner: "Ravi", partnerPhone: "6000000004" },
  "Freshly: Ravi (6000000004) has goods from order #75 for 2+ hrs, not returned yet.");
same("store.return_requested", { order: ORDER_NO },
  "Freshly: a customer asked to return items from order #ORD-MVDFSUGC-4F7K2P. Review it on the store Returns page.");
same("order.return_update", { orderNumber: ORDER_NO, update: RETURN_WORDS.REFUND_SENT(1250.5) },
  "Freshly: your return on order #ORD-MVDFSUGC-4F7K2P: Rs 1,250.50 refunded. Open the app for details.");
// Every return step's words fit a variable whole, even with a large amount.
for (const [step, words] of Object.entries(RETURN_WORDS)) {
  assert.equal(cleanSmsValue(words(123456.75)), words(123456.75), step);
}

// What a value may put into a text.
assert.equal(cleanSmsValue("₹1,250"), "Rs1,250");
assert.equal(cleanSmsValue("‘Ravi’ “K”"), "'Ravi' \"K\"");
assert.equal(cleanSmsValue(" a\nb\r\n\tc "), "a b c", "one line");
assert.equal(cleanSmsValue("Ravi 😀"), "Ravi", "outside GSM-7 is dropped");
assert.equal(cleanSmsValue("{x}[y]~|^\\€"), "xy", "extension characters count double, dropped");
assert.equal(cleanSmsValue("Customer not reachable — Caller didn't pick up"), "Customer not reachable", "cut at a whole word, no dangling dash");
assert.equal(cleanSmsValue("Wrong or incomplete address ok"), "Wrong or incomplete address ok", "exactly 30 stays");
assert.equal(cleanSmsValue("X".repeat(40)), "X".repeat(30), "one long word is cut hard");
assert.throws(() => render("partner.approved", { name: "😀" }), /missing template variable "name"/, "a value that cleans to nothing");
assert.throws(() => render("partner.approved", {}), /missing template variable/);
assert.deepEqual(
  Object.keys(ORDER_TEXTS).sort(),
  ["AWAITING_CUSTOMER_CONFIRMATION", "CANCELLED", "DELIVERED", "DELIVERY_FAILED", "OUT_FOR_DELIVERY", "PLACED"],
  "the statuses that text the customer (design 5.4)"
);
console.log("texts: ok");

// --- The events

const BASE = `http://localhost:${env.PORT}`;
const CHECK = "c0ffee02"; // every eventId this check makes starts with it
const key = { "x-internal-key": env.INTERNAL_API_KEY };
const post = async (eventType, data) => {
  const body = { eventId: `${CHECK}-${crypto.randomUUID().slice(9)}`, eventType, version: 1, occurredAt: new Date().toISOString(), data };
  const res = await fetch(`${BASE}/internal/notifications/events`, { method: "POST", headers: { "content-type": "application/json", ...key }, body: JSON.stringify(body) });
  return { status: res.status, created: (await res.json().catch(() => ({}))).data?.created, eventId: body.eventId };
};
const rowsFor = (eventId) => select("SELECT * FROM notifications WHERE source_event_id = :eventId ORDER BY id", { eventId });
const waitFinal = async (eventId) => {
  for (const end = Date.now() + 15000; Date.now() < end; await new Promise((r) => setTimeout(r, 250))) {
    const rows = await rowsFor(eventId);
    if (rows.every((row) => row.status !== "QUEUED" && row.status !== "SENDING")) return rows;
  }
  throw new Error(`rows of ${eventId} still not final`);
};
const cleanup = () => sequelize.query(`DELETE FROM notifications WHERE CAST(source_event_id AS text) LIKE '${CHECK}%'`);

const customer = await selectOne(
  `SELECT id FROM auth_users WHERE role = 'CUSTOMER' AND is_active AND deleted_at IS NULL AND phone IS NOT NULL ORDER BY id LIMIT 1`
);
assert.ok(customer, "needs one active customer with a phone");
const userId = Number(customer.id);
const order = { historyId: 990000001, orderId: 990001, orderNumber: "ORD-CHECK-990001", userId, totalAmount: "1250.50", changedBy: null };

try {
  await cleanup();

  // A status change texts the customer on their account mobile, keyed on the history row: a republish is a no-op.
  let r = await post("order.status.changed", { ...order, oldStatus: "PICKED_UP", newStatus: "OUT_FOR_DELIVERY" });
  assert.deepEqual([r.status, r.created], [202, 1], "out for delivery");
  let [row] = await waitFinal(r.eventId);
  assert.deepEqual([row.template_key, row.channel, row.status, Number(row.recipient_user_id)], ["order.out_for_delivery", "SMS", "SENT", userId]);
  assert.equal(row.destination, null, "raw phone cleared once sent");
  assert.match(row.destination_masked, /^\*{6}\d{4}$/);
  assert.equal((await post("order.status.changed", { ...order, oldStatus: "PICKED_UP", newStatus: "OUT_FOR_DELIVERY" })).created, 0, "same history row, new eventId");

  r = await post("order.status.changed", { ...order, historyId: 990000002, oldStatus: null, newStatus: "PLACED" });
  [row] = await waitFinal(r.eventId);
  assert.equal(render(row.template_key, row.vars).text,
    "Freshly: order #ORD-CHECK-990001 is placed. Total Rs 1,250.50. We'll text you when it is out for delivery.");

  // No text: an internal step, and a cancel the customer did themselves. A cancel by staff texts.
  assert.equal((await post("order.status.changed", { ...order, historyId: 990000003, newStatus: "READY_FOR_ASSIGNMENT" })).created, 0);
  assert.equal((await post("order.status.changed", { ...order, historyId: 990000004, newStatus: "CANCELLED", changedBy: String(userId) })).created, 0);
  r = await post("order.status.changed", { ...order, historyId: 990000005, newStatus: "CANCELLED", changedBy: 1 });
  assert.equal((await rowsFor(r.eventId))[0].template_key, "order.cancelled");

  // A step of a customer's return texts them whatever the status; a new ask also texts a store with a mobile.
  r = await post("order.status.changed", { ...order, historyId: 990000006, oldStatus: "DELIVERED", newStatus: "DELIVERED", returnStep: "REQUESTED", storePhone: "+91 60000 00005" });
  assert.deepEqual((await rowsFor(r.eventId)).map((one) => one.template_key).sort(), ["order.return_update", "store.return_requested"]);
  r = await post("order.status.changed", { ...order, historyId: 990000007, newStatus: "DELIVERED", returnStep: "REFUND_SENT", returnAmount: 120, storePhone: "12345" });
  const refundRows = await waitFinal(r.eventId);
  assert.equal(refundRows.length, 1, "only a new ask texts the store");
  assert.equal(render(refundRows[0].template_key, refundRows[0].vars).text,
    "Freshly: your return on order #ORD-CHECK-990001: Rs 120 refunded. Open the app for details.");

  // An applicant with no account here: kept as SKIPPED NO_ADDRESS, never sent.
  r = await post("partner.application.approved", { applicationId: crypto.randomUUID(), userId: 991999001, ref: 1001, name: "Ravi" });
  [row] = await rowsFor(r.eventId);
  assert.deepEqual([r.created, row.status, row.reason, row.destination], [1, "SKIPPED", "NO_ADDRESS", null]);

  // By value: an invitee, and a store contact written any way inventory allows.
  r = await post("partner.application.invited", { applicationId: crypto.randomUUID(), phone: "6000000001" });
  [row] = await waitFinal(r.eventId);
  assert.deepEqual([row.template_key, row.status, row.destination_masked], ["partner.invite", "SENT", "******0001"]);
  r = await post("delivery.attempt.failed", { orderId: 75, phone: "+91 60000-00002", attempt: 3, maxAttempts: 3, reason: "Other" });
  [row] = await rowsFor(r.eventId);
  assert.deepEqual([row.template_key, row.destination_hash], ["store.delivery_failed_final", hashDestination("6000000002")], "normalised to 10 digits");

  // Per number: the next text over the hourly limit is SKIPPED RATE_LIMITED and keeps no raw number.
  const drop = { orderId: 76, phone: "6000000003", attempt: 1, maxAttempts: 3, reason: "Customer not reachable" };
  for (let i = 0; i < SMS_LIMITS.hour; i++) assert.equal((await post("delivery.attempt.failed", drop)).created, 1);
  r = await post("delivery.attempt.failed", drop);
  [row] = await rowsFor(r.eventId);
  assert.deepEqual([row.status, row.reason, row.destination], ["SKIPPED", "RATE_LIMITED", null]);

  // Bad input is a 400 (the queue acks it, HTTP returns it).
  assert.equal((await post("delivery.attempt.failed", { ...drop, phone: "12345" })).status, 400, "not a mobile");
  assert.equal((await post("partner.application.approved", { applicationId: "x", ref: 1, name: "Ravi" })).status, 400, "no userId");
  assert.equal((await post("order.status.changed", { ...order, historyId: undefined, newStatus: "DELIVERED" })).status, 400, "no historyId");

  // Let the dispatcher finish before the rows go.
  const ours = await select(`SELECT DISTINCT CAST(source_event_id AS text) AS id FROM notifications WHERE CAST(source_event_id AS text) LIKE '${CHECK}%'`);
  for (const { id } of ours) await waitFinal(id);
  console.log("events: ok");
} finally {
  await cleanup().catch((error) => console.error("cleanup failed:", error.message));
  await sequelize.close();
}
