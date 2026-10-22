// Live check of the partner app's "me" routes (/delivery-partners/me): who may call them, that a partner only ever sees
// and moves their own assignments, the allowed status moves, the failed-attempt record, the auto-progression timers, offline
// partners being skipped, and the hand-over between partners (/handle-orders) with partner and staff tokens.
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
  assert.deepEqual(me.body.data.stats, { delivered_7d: 1, failed_7d: 1, handovers_given_7d: 0, handovers_received_7d: 0 });

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
  await sql("UPDATE delivery_assignments SET completed_at = now() - interval '1 minute' WHERE id = :id", { id: failed.id });
  assert.deepEqual((await call("GET", "/assignments?status=HISTORY&date=today", tokenA)).body.data.items.map((i) => i.id), [done.id, failed.id], "history sorts by finish time");
  const failedItem = history.body.data.items.find((i) => i.id === failed.id);
  assert.equal(failedItem.status, "DELIVERY_FAILED");
  assert.equal(failedItem.last_attempt_reason, "Customer not reachable");
  assert.equal(history.body.data.items.find((i) => i.id === done.id).status, "DELIVERED");
  assert.ok(history.body.data.items.every((i) => i.completed_at), "an inserted finished row gets completed_at");
  assert.deepEqual(history.body.data.counts, { COMPLETED: 1, FAILED: 1, TRANSFERRED: 0, CANCELLED: 0 });

  // History filters: an IST day range (both ends included) and a search on order number or customer name.
  const day = (offset) => new Date(Date.now() + 330 * 60 * 1000 + offset * 86400000).toISOString().slice(0, 10);
  const historyIds = async (query) => (await call("GET", `/assignments?status=HISTORY&${query}`, tokenA)).body.data.items.map((i) => i.id).sort();
  assert.deepEqual(await historyIds(`from=${day(0)}&to=${day(0)}`), [done.id, failed.id].sort(), "today..today");
  assert.deepEqual(await historyIds(`from=${day(1)}`), [], "from tomorrow");
  assert.deepEqual(await historyIds(`to=${day(-1)}`), [], "to yesterday");
  assert.deepEqual(await historyIds("search=990001"), [done.id], "order number");
  assert.deepEqual(await historyIds("search=check%20cust"), [done.id, failed.id].sort(), "part of the name, any case");
  assert.deepEqual(await historyIds("search=100%25"), [], "% is matched literally");
  const searched = (await call("GET", "/assignments?status=HISTORY&search=990001", tokenA)).body.data.counts;
  assert.deepEqual([searched.COMPLETED, searched.FAILED], [1, 0], "counts follow the filters");
  assert.equal((await call("GET", "/assignments?from=2026-02-31", tokenA)).status, 400, "not a real day");

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
  assert.equal((await move(a1, tokenA, { status: "DELIVERY_FAILED", reason_code: "BOGUS" })).status, 400, "only listed reasons");
  assert.equal((await move(a1, tokenA, { status: "DELIVERY_FAILED", reason_code: "OTHER" })).status, 400, "OTHER needs a note");
  assert.equal((await move(a1, tokenA, { status: "PICKED_UP", reason_code: "REFUSED" })).status, 400, "only a failure takes a reason");
  const fail = await move(a1, tokenA, { status: "DELIVERY_FAILED", reason_code: "CUSTOMER_NOT_REACHABLE", note: "Called twice" });
  assert.equal(fail.status, 200, JSON.stringify(fail.body));
  assert.equal(fail.body.data.status, "DELIVERY_FAILED");
  assert.equal(fail.body.data.assignment_status, "FAILED");
  assert.equal(fail.body.data.last_attempt_reason, "Customer not reachable — Called twice");
  assert.equal(await orderStatus(order1), "DELIVERY_FAILED");
  const attempts = await sql("SELECT attempt_number, failure_reason FROM delivery_attempts WHERE order_id = :id", { id: order1 });
  assert.deepEqual(attempts, [{ attempt_number: 1, failure_reason: "Customer not reachable — Called twice" }]);
  assert.equal((await a.reload()).current_active_orders, 1, "the failed drop frees a slot");
  assert.deepEqual((await call("GET", `/assignments/${a1.id}`, tokenA)).body.data.status_history.map((h) => h.status),
    ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERY_FAILED"]);
  assert.equal((await move(a1, tokenA, { status: "PICKED_UP" })).status, 409, "finished stays finished");

  // Re-assigning: an open assignment blocks it; a failed one does not, until the third failure.
  const assignError = (order_id) => HandleOrderService.assignOrder({ order_id }, null, "").then(() => null, (e) => e);
  assert.match((await assignError(order3)).message, /already assigned/, "b1 is still open");
  assert.doesNotMatch((await assignError(order1)).message, /already assigned|failed \d times/, "one failure: may be assigned again");
  for (const n of [2, 3]) await db.DeliveryAttempt.create({ order_id: order1, delivery_partner_id: a.id, attempt_number: n, failure_reason: "x", attempted_at: new Date() });
  const capped = await assignError(order1);
  assert.deepEqual([capped.statusCode, /failed 3 times/.test(capped.message)], [409, true], "no fourth attempt");
  await sql("DELETE FROM delivery_attempts WHERE order_id = :id AND attempt_number > 1", { id: order1 });

  for (const status of ["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"]) {
    const step = await move(a2, tokenA, { status });
    assert.equal(step.status, 200, JSON.stringify(step.body));
  }
  assert.equal(await orderStatus(order2), "DELIVERED");
  const [{ completed_at }] = await sql("SELECT completed_at FROM delivery_assignments WHERE id = :id", { id: a2.id });
  assert.ok(Date.now() - new Date(completed_at) < 60000, "the trigger stamps completed_at when the job closes");
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

  /* ---------- hand-over between partners: request, first partner confirms, second partner confirms receipt ---------- */
  // Over HTTP with partner tokens: a partner only touches their own work, staff are not limited to it. b owns d and holds
  // order5 (picked up); a is offline until the "going online" line below.
  const hand = async (urlPath, token, json = {}) => {
    const res = await fetch(`http://localhost:${env.PORT}/handle-orders${urlPath}`, {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(json),
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  };
  const tokenAdmin = tokenFor(992999, "ADMIN");
  const tokenCustomer = tokenFor(NO_PARTNER_USER, "CUSTOMER");
  const requestHandover = (token, assignment, to, extra = {}) =>
    hand(`/assignments/${assignment.id}/handover`, token, { new_delivery_partner_id: to.id, reason: "Bike broke down", ...extra });
  const handovers = (assignmentId) => sql("SELECT * FROM delivery_handovers WHERE assignment_id = :assignmentId", { assignmentId });
  const counts = async () => Object.fromEntries((await sql("SELECT id, current_active_orders AS n FROM delivery_partners WHERE id IN (:ids)", { ids: [a.id, b.id] })).map((r) => [r.id, Number(r.n)]));

  // request: who may, what is refused, and that a refusal writes nothing
  assert.equal((await requestHandover(tokenCustomer, d, a)).status, 403, "customer token");
  assert.equal((await requestHandover(tokenA, d, a)).status, 404, "not their assignment");
  assert.equal((await hand(`/assignments/${d.id}/handover`, tokenB, { new_delivery_partner_id: a.id })).status, 400, "a reason is required");
  assert.equal((await requestHandover(tokenB, d, a, { order_id: order3 })).status, 400, "order_id is not accepted: it comes from the assignment");
  const refused = await requestHandover(tokenB, d, a);
  assert.equal(refused.status, 409, "an offline partner is refused");
  assert.match(refused.body.message, /not capable of accepting/);
  assert.equal((await handovers(d.id)).length, 0, "and nothing was written");
  assert.equal(await orderStatus(order5), "PICKED_UP");

  await sql("UPDATE delivery_partners SET is_online = true WHERE id = :id", { id: a.id });
  assert.ok((await offered()).includes(a.id), "going online makes them offered again");
  const sent = await requestHandover(tokenB, d, a, { handover_latitude: 30.7, handover_longitude: 76.7 });
  assert.equal(sent.status, 201, JSON.stringify(sent.body));
  const handoverId = sent.body.data.id;
  assert.deepEqual([sent.body.data.status, Number(sent.body.data.order_id), sent.body.data.old_delivery_partner_id, sent.body.data.new_delivery_partner_id], ["PENDING", order5, b.id, a.id]);
  assert.equal(await orderStatus(order5), "HANDOVER_IN_PROGRESS");
  assert.equal((await requestHandover(tokenB, d, a)).status, 409, "a second request while one is open");

  // the Handover screen's lists, and who b can pick
  const listed = async (token, dir) => (await call("GET", `/handovers?dir=${dir}`, token)).body.data;
  const inA = (await listed(tokenA, "in")).find((h) => h.id === handoverId);
  assert.deepEqual(
    [inA?.status, inA?.order_id, inA?.assignment_id, inA?.other_partner?.name, inA?.other_partner?.phone, inA?.customer_name, inA?.cancelled_by],
    ["PENDING", order5, d.id, "Check Partner B", `99900${B_USER}`, "Check Customer", null],
    "the receiver sees it with the giver's name and phone while open",
  );
  assert.ok((await listed(tokenB, "out")).some((h) => h.id === handoverId), "the giver sees it as outgoing");
  assert.ok(!(await listed(tokenA, "out")).some((h) => h.id === handoverId), "not in the other direction");
  assert.equal((await call("GET", "/handovers?dir=sideways", tokenA)).status, 400);
  assert.equal((await call("GET", "/handovers", tokenA)).status, 400, "dir is required");
  const candidates = await call("GET", `/handovers/candidates?assignment_id=${d.id}`, tokenB);
  assert.equal(candidates.status, 200, JSON.stringify(candidates.body));
  assert.ok(candidates.body.data.some((p) => p.id === a.id && p.name === "Check Partner A"), "an online partner in the zone with room");
  assert.ok(!candidates.body.data.some((p) => p.id === b.id), "never yourself");
  assert.ok(candidates.body.data.every((p) => !("phone" in p)), "no phone numbers");
  assert.equal((await call("GET", `/handovers/candidates?assignment_id=${d.id}`, tokenA)).status, 404, "not their assignment");
  assert.equal((await call("GET", "/handovers/candidates", tokenB)).status, 400, "assignment_id is required");
  assert.equal((await call("PATCH", `/assignments/${d.id}/status`, tokenB, { status: "OUT_FOR_DELIVERY" })).status, 409, "no step moves while a handover is open");

  // first partner confirms
  const confirm = (step, token) => hand(`/partner/handover/${handoverId}/${step}`, token);
  assert.equal((await confirm("confirm-receipt", tokenA)).status, 409, "receipt before the first partner confirmed");
  assert.equal((await confirm("confirm-handover", tokenA)).status, 404, "only the first partner confirms the hand-over");
  assert.equal((await confirm("confirm-handover", tokenCustomer)).status, 403, "customer token");
  const first = await confirm("confirm-handover", tokenB);
  assert.equal(first.status, 200, JSON.stringify(first.body));
  assert.equal(first.body.data.status, "OLD_PARTNER_CONFIRMED");
  assert.ok(first.body.data.old_partner_confirmed_at);
  assert.deepEqual([Number(first.body.data.handover_latitude), Number(first.body.data.handover_longitude)], [30.7, 76.7], "the point sent with the request is kept");
  assert.equal((await confirm("confirm-handover", tokenB)).status, 409, "only once");

  // second partner confirms receipt: everything moves together
  assert.equal((await confirm("confirm-receipt", tokenB)).status, 404, "only the second partner confirms receipt");
  const before = await counts();
  const received = await confirm("confirm-receipt", tokenA);
  assert.equal(received.status, 200, JSON.stringify(received.body));
  assert.deepEqual([received.body.data.delivery_partner_id, received.body.data.status, Number(received.body.data.order_id)], [a.id, "ACTIVE", order5]);
  assert.equal((await handovers(d.id))[0].status, "COMPLETED");
  assert.ok((await handovers(d.id))[0].receipt_confirmed_at, "the receipt time is kept");
  assert.equal((await listed(tokenA, "in")).find((h) => h.id === handoverId)?.other_partner?.phone, null, "no phone once it is over");
  assert.equal((await hand(`/partner/handover/${handoverId}/cancel`, tokenA)).status, 409, "a finished handover cannot be called off");
  assert.equal((await sql("SELECT status FROM delivery_assignments WHERE id = :id", { id: d.id }))[0].status, "TRANSFERRED");
  assert.equal(await orderStatus(order5), "OUT_FOR_DELIVERY");
  const after = await counts();
  assert.deepEqual([after[b.id] - before[b.id], after[a.id] - before[a.id]], [-1, 1], "open counts move with the order");
  const held = (await call("GET", "/assignments", tokenA)).body.data.items.find((i) => String(i.order_id) === String(order5));
  assert.equal(held?.status, "OUT_FOR_DELIVERY", "the second partner's app shows it at the step they are holding it");
  assert.equal((await confirm("confirm-receipt", tokenA)).status, 409, "only once");
  const statsOf = async (token) => (await call("GET", "/", token)).body.data.stats;
  assert.deepEqual([(await statsOf(tokenB)).handovers_given_7d, (await statsOf(tokenA)).handovers_received_7d], [1, 1]);

  // The admin partner page: the partner's stats and open jobs, staff only.
  const work = (id, token) => fetch(`http://localhost:${env.PORT}/delivery-partners/${id}/work`, { headers: { authorization: `Bearer ${token}` } })
    .then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
  const aWork = await work(a.id, tokenAdmin);
  assert.equal(aWork.status, 200, JSON.stringify(aWork.body));
  assert.deepEqual(aWork.body.data.stats, await statsOf(tokenA));
  assert.ok(aWork.body.data.active.some((i) => String(i.order_id) === String(order5) && i.status === "OUT_FOR_DELIVERY"));
  assert.ok(aWork.body.data.active.every((i) => i.assignment_status === "ACTIVE"));
  assert.equal((await work(a.id, tokenA)).status, 403, "partner token");
  assert.equal((await work(NO_ID, tokenAdmin)).status, 404);

  // staff can run the same steps on any partner's work
  const order6 = await makeOrder(6);
  const e = await makeAssignment(b, order6);
  const pickedUp = await fetch(`http://localhost:${env.PORT}/handle-orders/assignments/${e.id}/update-status`, {
    method: "POST", headers: { authorization: `Bearer ${tokenAdmin}`, "content-type": "application/json" }, body: JSON.stringify({ status: "PICKED_UP" }),
  });
  assert.equal(pickedUp.status, 200, await pickedUp.text());
  const byStaff = await requestHandover(tokenAdmin, e, a);
  assert.equal(byStaff.status, 201, JSON.stringify(byStaff.body));
  assert.equal((await hand(`/partner/handover/${byStaff.body.data.id}/confirm-handover`, tokenAdmin)).status, 200, "staff confirm for the first partner");

  /* ---------- calling a handover off: the receiver declines, the giver withdraws, or staff ---------- */
  const cancel = (id, token) => hand(`/partner/handover/${id}/cancel`, token);
  const declineId = byStaff.body.data.id;
  assert.equal((await cancel(declineId, tokenCustomer)).status, 403, "customer token");
  assert.equal((await cancel(NO_ID, tokenA)).status, 404);
  const declined = await cancel(declineId, tokenA);
  assert.equal(declined.status, 200, JSON.stringify(declined.body));
  assert.deepEqual([declined.body.data.status, declined.body.data.cancelled_by], ["CANCELLED", a.id], "declined after the giver confirmed");
  assert.ok(declined.body.data.cancelled_at);
  assert.equal(await orderStatus(order6), "PICKED_UP", "the order is back with the giver");
  assert.equal((await sql("SELECT status FROM delivery_assignments WHERE id = :id", { id: e.id }))[0].status, "ACTIVE");
  assert.equal((await cancel(declineId, tokenA)).status, 409, "only once");
  assert.equal((await hand(`/partner/handover/${declineId}/confirm-receipt`, tokenA)).status, 409, "no receipt after a decline");
  assert.equal((await listed(tokenB, "out")).find((h) => h.id === declineId)?.cancelled_by, "OTHER", "the giver sees the receiver declined");

  const again = await requestHandover(tokenB, e, a);
  assert.equal(again.status, 201, "a new request after a decline");
  const withdrawn = await cancel(again.body.data.id, tokenB);
  assert.equal(withdrawn.status, 200, "the giver withdraws a pending one");
  assert.equal((await listed(tokenB, "out")).find((h) => h.id === again.body.data.id)?.cancelled_by, "YOU");
  const third = await requestHandover(tokenB, e, a);
  assert.equal((await cancel(third.body.data.id, tokenAdmin)).status, 200, "staff can call it off");
  assert.equal((await listed(tokenA, "in")).find((h) => h.id === third.body.data.id)?.cancelled_by, "STAFF");
  assert.equal(await orderStatus(order6), "PICKED_UP");
  const moved = await call("PATCH", `/assignments/${e.id}/status`, tokenB, { status: "OUT_FOR_DELIVERY" });
  assert.equal(moved.status, 200, `the giver carries on once nothing is open: ${JSON.stringify(moved.body)}`);

  console.log("partnerMe.check.js: all checks passed");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await cleanup();
  process.exit(process.exitCode ?? 0);
}
