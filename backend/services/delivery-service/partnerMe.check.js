// Live check of the partner app's "me" routes (/delivery-partners/me): who may call them, that a partner only ever sees
// and moves their own assignments, the allowed status moves, the failed-attempt record, and the auto-progression timers.
// Service and order-service must be running, dev only. Run: docker compose exec -T delivery-service node partnerMe.check.js
// Uses signed tokens for fake partners 993001-993003 and a fake customer; makes partners, assignments and orders named
// CHK-PM-n, and removes them all before and after.
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { env } from "./src/config/env.js";
import initializeModels from "./src/models/index.js";
import HandleOrderService from "./src/modules/handleOrder/handleOrder.service.js";
import DeliveryPartnerService from "./src/modules/deliveryPartner/deliveryPartner.service.js";

assert.notEqual(env.NODE_ENV, "production", "dev only");

const BASE = `http://localhost:${env.PORT}/delivery-partners/me`;
const [A_USER, B_USER, SUSPENDED_USER] = [993001, 993002, 993003];
const NO_PARTNER_USER = 993004;
const NO_ID = "00000000-0000-4000-8000-000000000000";

const tokenFor = (userId, role = "DELIVERY_PARTNER") => jwt.sign({ user_id: userId, phone: `99900${userId}`, role }, env.JWT_SECRET, { expiresIn: "5m" });
const call = async (method, urlPath, token, json) => {
  const headers = token ? { authorization: `Bearer ${token}` } : {};
  if (json !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(`${BASE}${urlPath}`, { method, headers, body: json === undefined ? undefined : JSON.stringify(json) });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const db = await initializeModels();
const sql = async (query, replacements = {}) => (await db.sequelize.query(query, { replacements }))[0];

const cleanup = async () => {
  const partners = "SELECT id FROM delivery_partners WHERE user_id IN (:ids)";
  const r = { ids: [A_USER, B_USER, SUSPENDED_USER] };
  await sql(`DELETE FROM delivery_attempts WHERE delivery_partner_id IN (${partners})`, r);
  await sql(`DELETE FROM delivery_status_history WHERE delivery_partner_id IN (${partners})`, r);
  await sql(`DELETE FROM delivery_assignment_history WHERE assignment_id IN (SELECT id FROM delivery_assignments WHERE delivery_partner_id IN (${partners}))`, r);
  await sql(`DELETE FROM delivery_handovers WHERE assignment_id IN (SELECT id FROM delivery_assignments WHERE delivery_partner_id IN (${partners}))`, r);
  await sql(`DELETE FROM delivery_assignments WHERE delivery_partner_id IN (${partners})`, r);
  await sql(`DELETE FROM delivery_partner_zones WHERE delivery_partner_id IN (${partners})`, r);
  await sql("DELETE FROM delivery_partners WHERE user_id IN (:ids)", r);
  await sql("DELETE FROM orders WHERE order_number LIKE 'CHK-PM-%'");
};
await cleanup();

try {
  /* ---------- fixtures ---------- */
  const makePartner = (user_id, name, status = "ACTIVE", current = 0) =>
    db.DeliveryPartner.create({ user_id, name, phone: `99900${user_id}`, vehicle_type: "Motorbike", vehicle_number: `CHKPM${user_id}`, max_active_orders: 4, current_active_orders: current, status, zone_id: 1, joined_at: new Date() });
  const a = await makePartner(A_USER, "Check Partner A", "ACTIVE", 2);
  const b = await makePartner(B_USER, "Check Partner B", "ACTIVE", 1);
  await makePartner(SUSPENDED_USER, "Check Suspended", "SUSPENDED");
  await db.DeliveryPartnerZone.create({ delivery_partner_id: a.id, zone_id: 1, is_primary: true });

  const makeOrder = async (n) => {
    const [{ id }] = await sql(
      `INSERT INTO orders (order_number, user_id, status, subtotal, total_amount, payment_status, created_at, updated_at)
       VALUES (:num, 993900, 'ASSIGNED', 10, 10, 'SUCCESS', now(), now()) RETURNING id`, { num: `CHK-PM-${n}` });
    await sql(
      `INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, unit, quantity, mrp, selling_price, line_total, status, created_at)
       VALUES (:id, 1, 1, 'Potato', 'Potato - kg', 'kg', 2, 10, 10, 20, 'READY', now()),
              (:id, 2, 2, 'Gone', 'Gone - kg', 'kg', 1, 10, 10, 10, 'NOT_AVAILABLE', now())`, { id });
    return Number(id);
  };
  const [order1, order2, order3] = [await makeOrder(1), await makeOrder(2), await makeOrder(3)];
  const orderStatus = async (id) => (await sql("SELECT status FROM orders WHERE id = :id", { id }))[0].status;

  const makeAssignment = async (partner, order_id, status = "ACTIVE") => {
    const assignment = await db.DeliveryAssignment.create({
      order_id, warehouse_id: 1, delivery_partner_id: partner.id, status, assigned_at: new Date(),
      pickup_name: "Check store", pickup_address: "1 Store Road", pickup_contact_phone: "9990000001",
      customer_name: "Check Customer", customer_phone: "9990000002", delivery_address: "2 Home Street",
    });
    if (status === "ACTIVE") await db.DeliveryStatusHistory.create({ order_id, delivery_partner_id: partner.id, status: "ASSIGNED" });
    return assignment;
  };
  const a1 = await makeAssignment(a, order1);
  const a2 = await makeAssignment(a, order2);
  const b1 = await makeAssignment(b, order3);
  const done = await makeAssignment(a, 990001, "COMPLETED");
  const failed = await makeAssignment(a, 990002, "FAILED");
  await db.DeliveryAttempt.create({ order_id: 990002, delivery_partner_id: a.id, attempt_number: 1, failure_reason: "Customer not reachable", attempted_at: new Date() });

  const tokenA = tokenFor(A_USER);
  const tokenB = tokenFor(B_USER);

  /* ---------- who may call ---------- */
  assert.equal((await call("GET", "/")).status, 401, "no token");
  assert.equal((await call("GET", "/", tokenFor(A_USER, "CUSTOMER"))).status, 403, "customer token");
  assert.equal((await call("GET", "/", tokenFor(A_USER, "ADMIN"))).status, 403, "staff token");
  assert.equal((await call("GET", "/", tokenFor(NO_PARTNER_USER))).status, 403, "partner role but no partner row");
  assert.equal((await call("GET", "/", tokenFor(SUSPENDED_USER))).status, 403, "suspended partner");

  /* ---------- profile ---------- */
  const me = await call("GET", "/", tokenA);
  assert.equal(me.status, 200);
  assert.equal(me.body.data.id, a.id);
  assert.equal(me.body.data.name, "Check Partner A");
  assert.equal(me.body.data.phone, `99900${A_USER}`);
  assert.equal(me.body.data.zones.length, 1);
  assert.equal(me.body.data.zones[0].is_primary, true);
  assert.deepEqual(me.body.data.stats, { delivered_7d: 1, failed_7d: 1 });

  /* ---------- online status: set, not flip; one UPDATE ... RETURNING, no read first ---------- */
  const online = async (userId) => (await sql("SELECT is_online, online_since FROM delivery_partners WHERE user_id = :userId", { userId }))[0];
  const setOnline = (token, value) => call("PATCH", "/online", token, value === undefined ? {} : { online: value });
  assert.equal((await setOnline(undefined, true)).status, 401, "no token");
  assert.equal((await setOnline(tokenFor(SUSPENDED_USER), true)).status, 403, "suspended partner");
  assert.equal((await setOnline(tokenFor(A_USER, "ADMIN"), true)).status, 403, "staff token");
  for (const bad of [undefined, "true", 1, null]) assert.equal((await setOnline(tokenA, bad)).status, 400, `body online=${bad}`);
  assert.deepEqual(await online(A_USER), { is_online: false, online_since: null }, "refused calls change nothing");
  assert.deepEqual((await setOnline(tokenA, true)).body.data, { id: a.id, is_online: true });
  const since = (await online(A_USER)).online_since;
  assert.ok(since, "online_since is set when going online");
  // Idempotent: the same request again changes nothing, and keeps the moment the partner first went online.
  assert.deepEqual((await setOnline(tokenA, true)).body.data, { id: a.id, is_online: true });
  assert.equal(String((await online(A_USER)).online_since), String(since), "repeating online keeps online_since");
  assert.equal((await setOnline(tokenA, false)).body.data.is_online, false);
  assert.deepEqual(await online(A_USER), { is_online: false, online_since: null }, "online_since is cleared going offline");
  assert.equal((await setOnline(tokenA, false)).body.data.is_online, false, "repeating offline is fine");
  // Two taps at once ask for the same state, so they agree (a flip would have cancelled out).
  const both = await Promise.all([setOnline(tokenA, true), setOnline(tokenA, true)]);
  assert.deepEqual(both.map((r) => r.body.data.is_online), [true, true], "parallel taps");
  assert.equal((await online(A_USER)).is_online, true);
  await setOnline(tokenA, false);
  assert.equal((await setOnline(tokenB, true)).body.data.id, b.id, "sets the caller's own row");
  assert.equal((await online(A_USER)).is_online, false, "and nobody else's");

  /* ---------- lists ---------- */
  const active = await call("GET", "/assignments", tokenA);
  assert.equal(active.status, 200);
  assert.deepEqual(active.body.data.items.map((i) => i.id).sort(), [a1.id, a2.id].sort(), "only my open work");
  assert.ok(active.body.data.items.every((i) => i.status === "ASSIGNED" && i.assignment_status === "ACTIVE"));
  assert.equal(active.body.data.total, 2);

  const history = await call("GET", "/assignments?status=HISTORY&date=today", tokenA);
  assert.deepEqual(history.body.data.items.map((i) => i.id).sort(), [done.id, failed.id].sort());
  // Finished work comes back most-recently-finished first: `failed` was made after `done`, so push it back to prove the sort is not by creation.
  await sql("UPDATE delivery_assignments SET updated_at = now() - interval '1 minute' WHERE id = :id", { id: failed.id });
  assert.deepEqual((await call("GET", "/assignments?status=HISTORY&date=today", tokenA)).body.data.items.map((i) => i.id), [done.id, failed.id], "history sorts by finish time");
  const failedItem = history.body.data.items.find((i) => i.id === failed.id);
  assert.equal(failedItem.status, "DELIVERY_FAILED");
  assert.equal(failedItem.last_attempt_reason, "Customer not reachable");
  assert.equal(history.body.data.items.find((i) => i.id === done.id).status, "DELIVERED");

  assert.equal((await call("GET", "/assignments?status=FAILED", tokenA)).body.data.total, 1);
  assert.equal((await call("GET", "/assignments?limit=1&page=2", tokenA)).body.data.items.length, 1, "paging");
  assert.equal((await call("GET", "/assignments?status=BOGUS", tokenA)).status, 400);
  assert.deepEqual((await call("GET", "/assignments", tokenB)).body.data.items.map((i) => i.id), [b1.id], "B sees only B's");

  /* ---------- one assignment ---------- */
  const detail = await call("GET", `/assignments/${a1.id}`, tokenA);
  assert.equal(detail.status, 200);
  assert.deepEqual(detail.body.data.order_items, [{ name: "Potato", qty: "2 kg" }], "unavailable lines are left out");
  assert.equal(detail.body.data.customer_phone, "9990000002");
  assert.deepEqual(detail.body.data.status_history.map((h) => h.status), ["ASSIGNED"]);
  assert.equal((await call("GET", `/assignments/${done.id}`, tokenA)).body.data.customer_phone, null, "no phone once finished");
  assert.equal((await call("GET", `/assignments/${b1.id}`, tokenA)).status, 404, "someone else's");
  assert.equal((await call("GET", `/assignments/${NO_ID}`, tokenA)).status, 404);
  assert.equal((await call("GET", "/assignments/not-a-uuid", tokenA)).status, 404);

  /* ---------- status moves ---------- */
  const move = (assignment, token, json) => call("PATCH", `/assignments/${assignment.id}/status`, token, json);
  assert.equal((await move(a1, tokenA, { status: "OUT_FOR_DELIVERY" })).status, 409, "no skipping the pickup");
  assert.equal((await move(a1, tokenA, { status: "ASSIGNED" })).status, 400, "not a partner move");
  assert.equal((await move(a1, tokenA, { status: "DELIVERED" })).status, 409);
  assert.equal((await move(a1, tokenB, { status: "PICKED_UP" })).status, 404, "not B's assignment");
  assert.equal((await move(done, tokenA, { status: "DELIVERED" })).status, 409, "already finished");

  const picked = await move(a1, tokenA, { status: "PICKED_UP" });
  assert.equal(picked.status, 200, JSON.stringify(picked.body));
  assert.equal(picked.body.data.status, "PICKED_UP");
  assert.equal(await orderStatus(order1), "PICKED_UP");
  const [{ changed_by }] = await sql("SELECT changed_by FROM order_status_history WHERE order_id = :id ORDER BY id DESC LIMIT 1", { id: order1 });
  assert.equal(Number(changed_by), A_USER, "the order records the partner who made the change");
  assert.equal((await move(a1, tokenA, { status: "PICKED_UP" })).status, 409, "same move twice");
  assert.equal((await call("GET", "/assignments", tokenA)).body.data.items.find((i) => i.id === a1.id).status, "PICKED_UP");

  assert.equal((await move(a1, tokenA, { status: "OUT_FOR_DELIVERY" })).body.data.status, "OUT_FOR_DELIVERY");
  assert.equal((await move(a1, tokenA, { status: "DELIVERY_FAILED" })).status, 400, "a failure needs its reason");
  assert.equal((await move(a1, tokenA, { status: "PICKED_UP", reason: "no" })).status, 400, "only a failure takes a reason");
  const fail = await move(a1, tokenA, { status: "DELIVERY_FAILED", reason: "Customer not reachable" });
  assert.equal(fail.status, 200, JSON.stringify(fail.body));
  assert.equal(fail.body.data.status, "DELIVERY_FAILED");
  assert.equal(fail.body.data.assignment_status, "FAILED");
  assert.equal(fail.body.data.last_attempt_reason, "Customer not reachable");
  assert.equal(await orderStatus(order1), "DELIVERY_FAILED");
  const attempts = await sql("SELECT attempt_number, failure_reason FROM delivery_attempts WHERE order_id = :id", { id: order1 });
  assert.deepEqual(attempts, [{ attempt_number: 1, failure_reason: "Customer not reachable" }]);
  assert.equal((await a.reload()).current_active_orders, 1, "the failed drop frees a slot");
  assert.deepEqual((await call("GET", `/assignments/${a1.id}`, tokenA)).body.data.status_history.map((h) => h.status),
    ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERY_FAILED"]);
  assert.equal((await move(a1, tokenA, { status: "PICKED_UP" })).status, 409, "finished stays finished");

  for (const status of ["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"]) {
    const step = await move(a2, tokenA, { status });
    assert.equal(step.status, 200, JSON.stringify(step.body));
  }
  assert.equal(await orderStatus(order2), "DELIVERED");
  assert.equal((await call("GET", "/assignments?status=COMPLETED&date=today", tokenA)).body.data.total, 2);
  assert.equal((await a.reload()).current_active_orders, 0);

  /* ---------- auto-progression timers ---------- */
  // Only a real update (one that carries a user) cancels the simulated steps; the timers' own calls pass no user.
  const timers = HandleOrderService.autoProgressionTimers;
  const sys = HandleOrderService.buildSystemAuthorization();
  const c = await makeAssignment(a, await makeOrder(4));
  HandleOrderService.scheduleAutoProgression(c.id);
  assert.equal(timers.get(c.id).length, 3);
  await HandleOrderService.updateStatus(c.id, { status: "PICKED_UP" }, null, sys);
  assert.equal(timers.get(c.id)?.length, 3, "a simulated step keeps the rest");
  await HandleOrderService.updateStatus(c.id, { status: "OUT_FOR_DELIVERY" }, { user_id: A_USER, role: "DELIVERY_PARTNER" }, sys, A_USER);
  assert.equal(timers.has(c.id), false, "a real update cancels them");

  /* ---------- the dispatcher route shares the same function ---------- */
  const order5 = await makeOrder(5);
  const d = await makeAssignment(b, order5);
  const staff = await fetch(`http://localhost:${env.PORT}/handle-orders/assignments/${d.id}/update-status`, {
    method: "POST",
    headers: { authorization: `Bearer ${tokenFor(992999, "ADMIN")}`, "content-type": "application/json" },
    body: JSON.stringify({ status: "PICKED_UP" }),
  });
  assert.equal(staff.status, 200, await staff.text());
  assert.equal(await orderStatus(order5), "PICKED_UP");
  assert.deepEqual((await call("GET", `/assignments/${d.id}`, tokenB)).body.data.status_history.map((h) => h.status), ["ASSIGNED", "PICKED_UP"]);

  /* ---------- assignment skips offline partners ---------- */
  // a is offline here (set in the online block), b is online. The zone list staff pick from and the server-side gate in
  // handOver (assignOrder and reAssignOrder share the same query) both refuse an offline partner; going online lifts it.
  const offered = async () => (await DeliveryPartnerService.getAllDeliveryPartnersByZoneId(1)).map((p) => p.id);
  assert.ok(!(await offered()).includes(a.id), "an offline partner is not offered");
  assert.ok((await offered()).includes(b.id), "an online one is");
  const handOverTo = (partner) => HandleOrderService.handOver({ new_delivery_partner_id: partner.id, order_id: order5, reason: "check" }, d.id, { user_id: 992999 }, sys);
  await assert.rejects(handOverTo(a), /not capable of accepting/, "hand-over to an offline partner is refused");
  await sql("UPDATE delivery_partners SET is_online = true WHERE id = :id", { id: a.id });
  assert.ok((await offered()).includes(a.id), "going online makes them offered again");
  assert.equal((await handOverTo(a)).status, "PENDING", "the same hand-over goes through once they are online");

  console.log("partnerMe.check.js: all checks passed");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await cleanup();
  process.exit(process.exitCode ?? 0);
}
