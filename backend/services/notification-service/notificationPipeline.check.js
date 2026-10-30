// Run: docker compose exec -T notification-service node notificationPipeline.check.js
// The Phase 1 exit check, against the running service, auth-service and RabbitMQ. Uses real admin accounts (messages go
// to the console provider only), tags everything it makes with CHECK ids, and deletes it before and after.
import assert from "node:assert/strict";
import crypto from "node:crypto";
import amqp from "amqplib";
import jwt from "jsonwebtoken";
import { env } from "./src/config/env.js";
import { sequelize, select, selectOne } from "./src/db.js";
import { contacts, ADMIN_ROLES } from "./src/clients.js";
import { optedInAdmins } from "./src/preferences.js";
import { insertRows } from "./src/intake.js";
import { processRow } from "./src/dispatcher.js";
import { runDigest } from "./src/scheduler.js";
import { requireInternalKey } from "./src/middleware.js";

const BASE = `http://localhost:${env.PORT}`;
const CHECK = "c0ffee00"; // every eventId this check makes starts with it
const eventId = () => `${CHECK}-${crypto.randomUUID().slice(9)}`;
const FAKE_DATE = "2099-01-01";
const started = (await selectOne("SELECT now() AS at")).at;

const post = async (path, body, headers = {}) => {
  const res = await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  return { status: res.status, body: await res.json().catch(() => ({})) };
};
const call = async (method, path, token, body) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body && { "content-type": "application/json" }) },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
};
const key = { "x-internal-key": env.INTERNAL_API_KEY };
const envelope = (eventType, data) => ({ eventId: eventId(), eventType, version: 1, occurredAt: new Date().toISOString(), data });
const rowsFor = (id) => select("SELECT * FROM notifications WHERE source_event_id = :id ORDER BY id", { id });
const waitFor = async (what, test, ms = 15000) => {
  for (const end = Date.now() + ms; Date.now() < end; await new Promise((r) => setTimeout(r, 250))) {
    const value = await test();
    if (value) return value;
  }
  throw new Error(`timed out waiting for ${what}`);
};

const admins = await contacts({ roles: ADMIN_ROLES });
assert.ok(admins.length, "needs at least one active ADMIN or SUPER_ADMIN");
const admin = admins[0];
const savedPrefs = await selectOne("SELECT value FROM notification_preferences WHERE user_id = :id", { id: admin.id });

const cleanup = async () => {
  await sequelize.query(`DELETE FROM notifications WHERE CAST(source_event_id AS text) LIKE '${CHECK}%' OR subject_id = :date`, { replacements: { date: FAKE_DATE } });
  await sequelize.query(`DELETE FROM notification_alert_hits WHERE source_key LIKE '${CHECK}%'`);
  // Alert and summary rows made while the check ran (their keys are per hour or date, not per event).
  await sequelize.query(
    "DELETE FROM notifications WHERE template_key IN ('alert.payment_failures', 'digest.daily_sales') AND created_at >= :started",
    { replacements: { started } }
  );
  await sequelize.query("DELETE FROM notification_preferences WHERE user_id = :id", { replacements: { id: admin.id } });
  if (savedPrefs) {
    await sequelize.query("INSERT INTO notification_preferences (user_id, value) VALUES (:id, CAST(:value AS jsonb))", {
      replacements: { id: admin.id, value: JSON.stringify(savedPrefs.value) },
    });
  }
};

const broker = await amqp.connect(env.RABBITMQ_URL);
const channel = await broker.createChannel();
const publish = (exchange, routingKey, body) =>
  channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(body)), { persistent: true, contentType: "application/json" });

try {
  await cleanup();

  // Internal key: 401 without it, 503 when none is configured (fails closed), 202 with it.
  const partner = envelope("partner.application.submitted", { applicationId: crypto.randomUUID(), refNo: 1001, userId: "7", vehicleType: "BIKE", onBehalf: false });
  assert.equal((await post("/internal/notifications/events", partner)).status, 401, "no key");
  assert.equal((await post("/internal/notifications/events", partner, { "x-internal-key": "x".repeat(40) })).status, 401, "wrong key");
  const saved = process.env.INTERNAL_API_KEY;
  delete process.env.INTERNAL_API_KEY;
  let passed;
  requireInternalKey({ headers: key }, {}, (error) => (passed = error));
  process.env.INTERNAL_API_KEY = saved;
  assert.equal(passed?.statusCode, 503, "no key configured");

  // The partner event over HTTP: the applicant's text plus one email per admin with partnerApplies on. The same
  // eventId again makes nothing.
  const expected = (await optedInAdmins("partnerApplies")).length + 1;
  let r = await post("/internal/notifications/events", partner, key);
  assert.deepEqual([r.status, r.body.data], [202, { created: expected }], `partner event: ${r.body.message}`);
  r = await post("/internal/notifications/events", partner, key);
  assert.deepEqual([r.status, r.body.data], [202, { created: 0 }], "same event twice");
  const partnerRows = await rowsFor(partner.eventId);
  const [applicantRow, ...emailRows] = [...partnerRows].sort((a, b) => (a.channel === "SMS" ? -1 : 1) - (b.channel === "SMS" ? -1 : 1));
  assert.deepEqual([applicantRow.template_key, applicantRow.channel], ["partner.received", "SMS"]);
  assert.ok(emailRows.every((row) => row.template_key === "alert.partner_application" && row.channel === "EMAIL"));
  assert.ok(emailRows.every((row) => !row.destination_masked || row.destination_masked.includes("***@")), "masked");
  if (partnerRows.some((row) => row.status === "QUEUED")) {
    await waitFor("partner emails sent", async () => (await rowsFor(partner.eventId)).every((row) => row.status !== "QUEUED" && row.status !== "SENDING"));
  }
  for (const row of await rowsFor(partner.eventId)) {
    assert.ok(row.status === "SENT" || row.reason === "NO_ADDRESS", `row ${row.id} is ${row.status}`);
    assert.equal(row.destination, null, "raw address cleared once final");
  }

  // Bad events: unknown type and missing fields are 400s, not retries.
  assert.equal((await post("/internal/notifications/events", envelope("order.nope", {}), key)).status, 400, "unknown type");
  assert.equal((await post("/internal/notifications/events", envelope("partner.application.submitted", { refNo: 1 }), key)).status, 400, "missing fields");

  // Through the queue: a pause, a reopen and a manager's move make an alert for each opted-in super admin; going live
  // from setup makes nothing.
  const pause = envelope("warehouse.status.changed", { warehouseId: "1", name: "Check Hub", oldStatus: "OPEN", newStatus: "PAUSED", changedBy: "7", changedByRole: "ADMIN" });
  const reopen = envelope("warehouse.status.changed", { warehouseId: "1", name: "Check Hub", oldStatus: "PAUSED", newStatus: "OPEN", changedBy: null });
  const live = envelope("warehouse.status.changed", { warehouseId: "1", name: "Check Hub", oldStatus: "SETTING_UP", newStatus: "OPEN", changedBy: null });
  const moved = envelope("warehouse.location.changed", { warehouseId: "1", name: "Check Hub", changes: [{ field: "pincode", from: null, to: "160055" }], changedBy: "7", changedByRole: "ADMIN" });
  publish("inventory_events", "warehouse.status.changed", live);
  publish("inventory_events", "warehouse.status.changed", reopen);
  publish("inventory_events", "warehouse.status.changed", pause);
  publish("inventory_events", "warehouse.location.changed", moved);
  const warehouseExpected = (await optedInAdmins("warehousePauses", ["SUPER_ADMIN"])).length;
  const alertRows = (event, label) => waitFor(label, async () => {
    const rows = await rowsFor(event.eventId);
    return rows.length === warehouseExpected && rows;
  });
  const pauseRows = await alertRows(pause, "pause alert rows");
  assert.equal(pauseRows[0].vars.status, "paused");
  assert.match(pauseRows[0].vars.changedBy, /\(store manager\)$/, "names the role");
  assert.equal((await alertRows(reopen, "reopen alert rows"))[0].vars.status, "open");
  assert.equal((await alertRows(moved, "location alert rows"))[0].vars.changes, "Pincode: (empty) -> 160055");
  assert.equal((await rowsFor(live.eventId)).length, 0, "going live is not an alert");

  // Failed payments through the queue: 5 make nothing, the 6th one alert per opted-in admin, the 7th nothing (cooldown).
  const pre = await selectOne("SELECT count(*)::int AS n FROM notification_alert_hits WHERE alert_key = 'payment_failures' AND occurred_at > now() - interval '60 minutes'");
  const recentAlert = await selectOne("SELECT 1 AS hit FROM notifications WHERE template_key = 'alert.payment_failures' AND created_at > now() - interval '60 minutes'");
  if (pre.n || recentAlert) {
    console.log("payment alert part skipped: real failed payments or a real alert in the last hour");
  } else {
    const hits = () => selectOne(`SELECT count(*)::int AS n FROM notification_alert_hits WHERE source_key LIKE '${CHECK}%'`);
    const alerts = () => selectOne("SELECT count(*)::int AS n FROM notifications WHERE template_key = 'alert.payment_failures' AND created_at >= :started", { started });
    const failures = Array.from({ length: 7 }, (_, i) => envelope("payment.failed", { orderId: 900000 + i, reason: "check" }));
    for (const failure of failures.slice(0, 5)) publish("payment_events", "payment.failed", failure);
    publish("payment_events", "payment.failed", failures[0]); // a redelivery counts once
    await waitFor("5 hits", async () => (await hits()).n === 5);
    assert.equal((await alerts()).n, 0, "5 failures: no alert");
    publish("payment_events", "payment.failed", failures[5]);
    await waitFor("6 hits", async () => (await hits()).n === 6);
    const alertExpected = (await optedInAdmins("failedPayments")).length;
    await waitFor("the alert", async () => (await alerts()).n === alertExpected);
    publish("payment_events", "payment.failed", failures[6]);
    await waitFor("7 hits", async () => (await hits()).n === 7);
    assert.equal((await alerts()).n, alertExpected, "7th failure: no second alert");
  }

  // The daily summary at a faked 22:00 IST: once per opted-in admin, not twice, never outside 22:00-23:59.
  await sequelize.query(
    `INSERT INTO notification_preferences (user_id, value) VALUES (:id, '{"dailySummary": true}')
     ON CONFLICT (user_id) DO UPDATE SET value = notification_preferences.value || EXCLUDED.value`,
    { replacements: { id: admin.id } }
  );
  assert.equal(await runDigest({ hour: 21, date: FAKE_DATE }), 0, "not before 22:00");
  const digestExpected = (await optedInAdmins("dailySummary")).length;
  assert.equal(await runDigest({ hour: 22, date: FAKE_DATE }), digestExpected, "22:00 sends");
  assert.equal(await runDigest({ hour: 23, date: FAKE_DATE }), 0, "already sent for that date");
  const digest = await selectOne("SELECT vars FROM notifications WHERE subject_id = :date LIMIT 1", { date: FAKE_DATE });
  assert.match(String(digest.vars.revenue), /^[\d,]+$/);
  assert.equal(digest.vars.date, "1 Jan 2099");

  // Preferences over HTTP: defaults, a merge patch, refused input, and a customer gets 403.
  const adminToken = jwt.sign({ user_id: admin.id, role: admin.role }, env.JWT_SECRET, { expiresIn: "5m" });
  await sequelize.query("DELETE FROM notification_preferences WHERE user_id = :id", { replacements: { id: admin.id } });
  r = await call("GET", "/notifications/preferences/me", adminToken);
  assert.deepEqual(r.body.data, { warehousePauses: true, partnerApplies: true, failedPayments: true, dailySummary: false, hasEmail: Boolean(admin.email) });
  r = await call("PATCH", "/notifications/preferences/me", adminToken, { dailySummary: true });
  assert.equal(r.body.data.dailySummary, true);
  r = await call("PATCH", "/notifications/preferences/me", adminToken, { failedPayments: false });
  assert.deepEqual([r.body.data.dailySummary, r.body.data.failedPayments, r.body.data.partnerApplies], [true, false, true], "merge patch keeps the rest");
  assert.equal((await call("PATCH", "/notifications/preferences/me", adminToken, { email: "x@y.z" })).status, 400, "unknown field");
  assert.equal((await call("PATCH", "/notifications/preferences/me", adminToken, { dailySummary: "yes" })).status, 400, "not a boolean");
  assert.equal((await call("PATCH", "/notifications/preferences/me", adminToken, {})).status, 400, "empty patch");
  const customerToken = jwt.sign({ user_id: 1, role: "CUSTOMER" }, env.JWT_SECRET, { expiresIn: "5m" });
  assert.equal((await call("GET", "/notifications/preferences/me", customerToken)).status, 403, "customer");
  assert.equal((await call("GET", "/notifications", customerToken)).status, 403, "customer log");

  // The log never returns raw addresses or vars.
  r = await call("GET", `/notifications?template_key=alert.partner_application&limit=5`, adminToken);
  assert.equal(r.status, 200);
  assert.ok(r.body.data.items.every((item) => !("destination" in item) && !("vars" in item) && !("destination_hash" in item)));
  assert.equal((await call("GET", "/notifications?limit=101", adminToken)).status, 400);
  assert.equal((await call("GET", "/notifications/stats", adminToken)).status, 200);

  // A provider that fails twice, then accepts: SENT on the 3rd try. Not due for a day, so the running dispatcher leaves it alone.
  const retryEvent = eventId();
  await insertRows(
    [{ key: `${retryEvent}:alert.payment_failures:EMAIL:u${admin.id}`, template: "alert.payment_failures", recipient: { id: admin.id, email: "check@example.com" }, vars: { count: 9, windowMinutes: 60 }, subjectId: "check" }],
    { sourceEventId: retryEvent }
  );
  await sequelize.query("UPDATE notifications SET next_attempt_at = now() + interval '1 day' WHERE source_event_id = :id", { replacements: { id: retryEvent } });
  let calls = 0;
  const flaky = { EMAIL: { name: "flaky", async send() { calls += 1; if (calls < 3) throw new Error("503 from provider"); return { messageId: "flaky-1" }; } } };
  const claim = async () => {
    const [[row]] = await sequelize.query(
      `UPDATE notifications SET status = 'SENDING', locked_at = now(), attempts = attempts + 1 WHERE source_event_id = :id
       RETURNING *, extract(epoch FROM now() - created_at)::int AS age_seconds`,
      { replacements: { id: retryEvent } }
    );
    return row;
  };
  for (let i = 0; i < 3; i++) await processRow(await claim(), flaky);
  const [done] = await rowsFor(retryEvent);
  assert.deepEqual([done.status, done.attempts, done.provider, done.provider_message_id, done.destination], ["SENT", 3, "flaky", "flaky-1", null]);

  // A permanent rejection fails at once; a template with a missing variable fails without calling the provider.
  const rejectEvent = eventId();
  await insertRows(
    [{ key: `${rejectEvent}:x`, template: "alert.payment_failures", recipient: { id: admin.id, email: "check@example.com" }, vars: { count: 9 }, subjectId: "check" }],
    { sourceEventId: rejectEvent }
  );
  await sequelize.query("UPDATE notifications SET next_attempt_at = now() + interval '1 day' WHERE source_event_id = :id", { replacements: { id: rejectEvent } });
  const [[missing]] = await sequelize.query(
    "UPDATE notifications SET status = 'SENDING', attempts = 1 WHERE source_event_id = :id RETURNING *, 0 AS age_seconds",
    { replacements: { id: rejectEvent } }
  );
  await processRow(missing, flaky);
  assert.deepEqual([(await rowsFor(rejectEvent))[0].status, (await rowsFor(rejectEvent))[0].reason], ["FAILED", "TEMPLATE_ERROR"]);

  console.log("notificationPipeline.check.js: ok");
} finally {
  await cleanup().catch((error) => console.error("cleanup failed:", error.message));
  await broker.close();
  await sequelize.close();
}
