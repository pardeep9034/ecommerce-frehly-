// Live check of returns phase 3: a customer asks to return a delivered item (24 h window, photo for damaged / bad
// quality / wrong item), the store rejects (reason kept from the customer) or approves with or without a pickup, and a
// rider collects it (or not) and brings it to the store with the return code, where it is inspected and refunded.
// Service, order-service and notification-service must be running, dev only.
// Run: docker compose exec -T delivery-service node customerReturns.check.js
// Uses a fake partner 994002 and customer 994901, orders named CHK-CR-n; removes them all before and after. Every
// returned line is written off and no wrong item gets a sent variant, so inventory is never touched.
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { env } from "./src/config/env.js";
import initializeModels from "./src/models/index.js";
import DeliveryPartnerService from "./src/modules/deliveryPartner/deliveryPartner.service.js";
import HandleOrderService from "./src/modules/handleOrder/handleOrder.service.js";
import { pickupCode } from "./src/utils/pickupCode.js";

assert.notEqual(env.NODE_ENV, "production", "dev only");

const RIDER_USER = 994002;
const CUSTOMER = 994901;
const tokenFor = (userId, role) => jwt.sign({ user_id: userId, phone: `99900${userId}`, role }, env.JWT_SECRET, { expiresIn: "5m" });
const tokens = {
  rider: tokenFor(RIDER_USER, "DELIVERY_PARTNER"),
  admin: tokenFor(994999, "ADMIN"),
  customer: tokenFor(CUSTOMER, "CUSTOMER"),
  stranger: tokenFor(CUSTOMER + 1, "CUSTOMER"),
};

const request = async (url, method, token, json) => {
  const headers = { authorization: `Bearer ${token}` };
  if (json !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(url, { method, headers, body: json === undefined ? undefined : JSON.stringify(json) });
  return { status: res.status, body: await res.json().catch(() => null) };
};
const me = (method, path, json) => request(`http://localhost:${env.PORT}/delivery-partners/me${path}`, method, tokens.rider, json);
const dispatch = (method, path, json) => request(`http://localhost:${env.PORT}/handle-orders${path}`, method, tokens.admin, json);
const orders = (who, method, path, json) => request(`${env.ORDER_SERVICE_URL}${path}`, method, tokens[who], json);

const db = await initializeModels();
const sql = async (query, replacements = {}) => (await db.sequelize.query(query, { replacements }))[0];

const cleanup = async () => {
  const partners = "SELECT id FROM delivery_partners WHERE user_id = :user";
  const r = { user: RIDER_USER };
  await sql(`DELETE FROM delivery_status_history WHERE delivery_partner_id IN (${partners})`, r);
  await sql(`DELETE FROM delivery_assignment_history WHERE assignment_id IN (SELECT id FROM delivery_assignments WHERE delivery_partner_id IN (${partners}))`, r);
  await sql(`DELETE FROM delivery_assignments WHERE delivery_partner_id IN (${partners})`, r);
  await sql(`DELETE FROM delivery_partner_zones WHERE delivery_partner_id IN (${partners})`, r);
  await sql("DELETE FROM delivery_partners WHERE user_id = :user", r);
  await sql("DELETE FROM notifications WHERE vars->>'orderNumber' LIKE 'CHK-CR-%' OR vars->>'order' LIKE 'CHK-CR-%'");
  await sql("DELETE FROM orders WHERE order_number LIKE 'CHK-CR-%'");
};
await cleanup();

try {
  /* ---------- fixtures: one online rider; delivered orders (prepaid, cash, one delivered 25 h ago) ---------- */
  const rider = await db.DeliveryPartner.create({
    user_id: RIDER_USER, name: "Check Rider", phone: `99900${RIDER_USER}`, vehicle_type: "Motorbike", vehicle_number: "CHKCR1",
    max_active_orders: 4, current_active_orders: 0, status: "ACTIVE", zone_id: 1, joined_at: new Date(), is_online: true, online_since: new Date(),
  });
  await db.DeliveryPartnerZone.create({ delivery_partner_id: rider.id, zone_id: 1, is_primary: true });

  // Potato 2 x 10 and Onion 1 x 10: 30 in all, delivered `hoursAgo` hours ago.
  const makeOrder = async (n, cod, hoursAgo = 0) => {
    const [{ id }] = await sql(
      `INSERT INTO orders (order_number, user_id, warehouse_id, status, subtotal, total_amount, payment_status, collected_method, collected_amount, created_at, updated_at)
       VALUES (:num, :user, 1, 'DELIVERED', 30, 30, 'SUCCESS', :method, :collected, now(), now()) RETURNING id`,
      { num: `CHK-CR-${n}`, user: CUSTOMER, method: cod ? "CASH" : null, collected: cod ? 30 : null });
    await sql(
      `INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, unit, quantity, mrp, selling_price, line_total, status, created_at)
       VALUES (:id, 1, 1, 'Potato', 'Potato - kg', 'kg', 2, 10, 10, 20, 'READY', now()),
              (:id, 2, 2, 'Onion', 'Onion - kg', 'kg', 1, 10, 10, 10, 'READY', now())`, { id });
    await sql(`INSERT INTO payments (order_id, payment_method, amount, status, created_at) VALUES (:id, :method, 30, 'SUCCESS', now())`,
      { id, method: cod ? "COD" : "UPI" });
    await sql(`INSERT INTO order_addresses (order_id, full_name, phone, address_line_1, city, state, postal_code, created_at)
       VALUES (:id, 'Check Customer', '9990000002', '2 Home Street', 'City', 'State', '110001', now())`, { id });
    await sql(`INSERT INTO order_status_history (order_id, old_status, new_status, created_at)
       VALUES (:id, 'OUT_FOR_DELIVERY', 'DELIVERED', now() - make_interval(hours => :hoursAgo))`, { id, hoursAgo });
    return Number(id);
  };
  const [prepaid, cod, late] = [await makeOrder(1, false), await makeOrder(2, true), await makeOrder(3, false, 25)];
  const items = async (orderId) => (await sql("SELECT id FROM order_items WHERE order_id = :orderId ORDER BY id", { orderId })).map((r) => Number(r.id));
  const returnRows = (orderId) => sql("SELECT * FROM order_returns WHERE order_id = :orderId ORDER BY id", { orderId });
  const offered = async () => (await DeliveryPartnerService.getAllDeliveryPartnersByZoneId(1)).map((p) => p.id);

  // A 1x1 PNG.
  const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const ask = (orderId, body, who = "customer") => orders(who, "POST", `/${orderId}/returns`, body);
  const review = (orderId, returnId, body) => orders("admin", "PATCH", `/${orderId}/returns/${returnId}/review`, body);

  /* ---------- asking: who, when, what ---------- */
  const [pp, po] = await items(prepaid);
  assert.equal((await ask(prepaid, { order_item_id: pp, quantity: 1, reason: "DAMAGED", photo: png }, "admin")).status, 403, "staff can't ask");
  assert.equal((await ask(prepaid, { order_item_id: pp, quantity: 1, reason: "DAMAGED" })).status, 400, "damaged needs a photo");
  assert.equal((await ask(prepaid, { order_item_id: pp, quantity: 1, reason: "DAMAGED", photo: Buffer.from("not an image at all").toString("base64") })).status, 415);
  assert.equal((await ask(prepaid, { order_item_id: pp, quantity: 3, reason: "DAMAGED", photo: png })).status, 400, "more than was delivered");
  assert.equal((await ask(prepaid, { order_item_id: pp, quantity: 1, reason: "DAMAGED", photo: png }, "stranger")).status, 403, "someone else's order");
  const [lp] = await items(late);
  assert.equal((await ask(late, { order_item_id: lp, quantity: 1, reason: "DAMAGED", photo: png })).status, 409, "the 24 h window closed");
  await sql(`INSERT INTO order_status_history (order_id, old_status, new_status, created_at) VALUES (:late, 'DELIVERED', 'DELIVERED', now())`, { late });
  assert.equal((await ask(late, { order_item_id: lp, quantity: 1, reason: "DAMAGED", photo: png })).status, 409, "a later note doesn't reopen it");

  const asked = await ask(prepaid, { order_item_id: pp, quantity: 1, reason: "DAMAGED", photo: png, note: "Squashed" });
  assert.equal(asked.status, 200, JSON.stringify(asked.body));
  let [potato] = await returnRows(prepaid);
  assert.deepEqual([potato.source, potato.status, Number(potato.refund_amount), potato.refund_status], ["CUSTOMER", "REQUESTED", 10, "PENDING"]);
  assert.ok(asked.body.data.returns.every((row) => !("photo" in row)), "the photo never rides along with the order");
  assert.equal((await ask(prepaid, { order_item_id: pp, quantity: 2, reason: "BAD_QUALITY", photo: png })).status, 400, "only one potato is left to return");

  const photoOf = (who, returnId) => fetch(`${env.ORDER_SERVICE_URL}/${prepaid}/returns/${returnId}/photo`, { headers: { authorization: `Bearer ${tokens[who]}` } });
  let photo = await photoOf("customer", potato.id);
  assert.deepEqual([photo.status, photo.headers.get("content-type")], [200, "image/png"]);
  assert.equal((await photoOf("admin", potato.id)).status, 200, "staff see it");
  assert.equal((await photoOf("stranger", potato.id)).status, 403);

  /* ---------- review: a rejection is final and its reason stays with staff ---------- */
  assert.equal((await ask(prepaid, { order_item_id: po, quantity: 1, reason: "MISSING" })).status, 200, "missing needs no photo");
  const onion = (await returnRows(prepaid))[1];
  assert.equal((await review(prepaid, onion.id, { decision: "REJECT" })).status, 400, "a rejection needs a reason");
  assert.equal((await review(prepaid, onion.id, { decision: "REJECT", reject_reason: "NO_PROOF" })).status, 200);
  assert.deepEqual([(await returnRows(prepaid))[1].status, (await returnRows(prepaid))[1].reject_reason], ["REJECTED", "NO_PROOF"]);
  assert.equal((await review(prepaid, onion.id, { decision: "APPROVE", pickup: false })).status, 409, "final");
  const seen = (await orders("customer", "GET", `/${prepaid}`)).body.data.returns.find((row) => Number(row.id) === Number(onion.id));
  assert.equal(seen.status, "REJECTED");
  assert.ok(!("reject_reason" in seen), "the customer never sees why");
  assert.equal((await orders("admin", "GET", `/${prepaid}`)).body.data.returns.find((row) => Number(row.id) === Number(onion.id)).reject_reason, "NO_PROOF");
  assert.equal((await review(prepaid, potato.id, { decision: "APPROVE", pickup: false, sent_variant_id: 2 })).status, 400, "only a wrong item has a sent variant");

  // Approved with no pickup: closed and refunded now, nothing comes back. The fixture's payment has no gateway id, so
  // the refund is recorded as FAILED, never lost.
  assert.equal((await review(prepaid, potato.id, { decision: "APPROVE", pickup: false })).status, 200);
  [potato] = await returnRows(prepaid);
  assert.deepEqual([potato.status, Number(potato.restock_qty), Number(potato.write_off_qty)], ["CLOSED", 0, 1]);
  assert.ok(["SENT", "FAILED"].includes(potato.refund_status), potato.refund_status);
  assert.equal((await sql("SELECT status FROM orders WHERE id = :prepaid", { prepaid }))[0].status, "DELIVERED", "the order stays delivered");

  /* ---------- with a pickup: a rider who couldn't collect, then one who did ---------- */
  const [cp] = await items(cod);
  assert.equal((await ask(cod, { order_item_id: cp, quantity: 2, reason: "BAD_QUALITY", photo: png })).status, 200);
  let [ret] = await returnRows(cod);
  assert.equal((await dispatch("POST", "/assignments/assign-pickup", { order_id: cod, delivery_partner_id: rider.id })).status, 409, "not approved yet");
  assert.equal((await review(cod, ret.id, { decision: "APPROVE", pickup: true })).status, 200);
  [ret] = await returnRows(cod);
  assert.deepEqual([ret.status, ret.assignment_id], ["APPROVED", null]);

  const sendRider = async () => {
    const sent = await dispatch("POST", "/assignments/assign-pickup", { order_id: cod, delivery_partner_id: rider.id });
    assert.equal(sent.status, 201, JSON.stringify(sent.body));
    return sent.body.data.id;
  };
  const first = await sendRider();
  assert.equal((await returnRows(cod))[0].assignment_id, first, "the return rides on this job");
  assert.equal((await dispatch("POST", "/assignments/assign-pickup", { order_id: cod, delivery_partner_id: rider.id })).status, 409, "one rider per return");

  const job = (await me("GET", "/assignments")).body.data.items.find((row) => row.id === first);
  assert.deepEqual([job.kind, job.status], ["RETURN_PICKUP", "RETURN_PICKUP"]);
  const detail = (await me("GET", `/assignments/${first}`)).body.data;
  assert.deepEqual([detail.order_items, detail.door, detail.customer_phone], [[{ name: "Potato", qty: "2 kg" }], null, "9990000002"]);
  assert.equal((await me("PATCH", `/assignments/${first}/status`, { status: "OUT_FOR_DELIVERY" })).status, 409, "not a delivery");

  assert.equal((await me("PATCH", `/assignments/${first}/pickup`, { collected: false })).status, 200);
  [ret] = await returnRows(cod);
  assert.deepEqual([ret.status, ret.assignment_id], ["APPROVED", null], "waits for another rider");
  assert.equal((await me("PATCH", `/assignments/${first}/pickup`, { collected: true })).status, 409, "finished once");

  // order-service ties the returns to the job, then its answer is lost: the job rolls back and the returns are untied.
  const { recordPickup } = HandleOrderService;
  HandleOrderService.recordPickup = async function (assignment, step, actorId) {
    await recordPickup.call(this, assignment, step, actorId);
    if (step === "ASSIGNED") throw new Error("answer lost");
  };
  const lost = await HandleOrderService.assignPickup({ order_id: cod, delivery_partner_id: rider.id }, { user_id: 994999 }, `Bearer ${tokens.admin}`)
    .then(() => null, (error) => error);
  HandleOrderService.recordPickup = recordPickup;
  assert.equal(lost?.message, "answer lost");
  [ret] = await returnRows(cod);
  assert.deepEqual([ret.status, ret.assignment_id], ["APPROVED", null], "untied, so another rider can be sent");
  assert.equal((await sql("SELECT count(*)::int AS n FROM delivery_assignments WHERE order_id = :cod", { cod }))[0].n, 1, "no job left behind");

  const second = await sendRider();
  // The first tap's order-service save went through but delivery-service didn't commit (a crash): the job is still
  // open, the items are already on their way. "Couldn't collect" is refused; tapping "Collected" again finishes it.
  await sql("UPDATE order_returns SET status = 'IN_TRANSIT' WHERE assignment_id = :second", { second });
  const refused = await me("PATCH", `/assignments/${second}/pickup`, { collected: false });
  assert.deepEqual([refused.status, refused.body.message], [409, "These items were already marked collected"]);
  assert.equal((await me("GET", `/assignments/${second}`)).body.data.assignment_status, "ACTIVE", "nothing saved on a refusal");
  assert.equal((await me("PATCH", `/assignments/${second}/pickup`, { collected: true })).status, 200, "a repeat finishes the job");
  [ret] = await returnRows(cod);
  assert.equal(ret.status, "IN_TRANSIT");
  const due = (await me("GET", "/")).body.data.returns_due;
  assert.deepEqual(due.map((row) => [row.assignment_id, row.kind]), [[second, "CUSTOMER"]]);
  assert.ok(!(await offered()).includes(rider.id), "holding a customer's return blocks new orders");
  assert.ok((await dispatch("GET", "/returns-due")).body.data.some((row) => row.assignment_id === second && row.kind === "CUSTOMER"));

  assert.equal((await dispatch("POST", `/assignments/${second}/returned`, { return_code: pickupCode(second, "return") })).status, 200);
  [ret] = await returnRows(cod);
  assert.equal(ret.status, "RECEIVED");
  assert.equal((await orders("admin", "PATCH", `/${cod}/returns/inspect`, { items: [{ return_id: Number(ret.id), restock_qty: 0, write_off_qty: 2 }] })).status, 200);
  [ret] = await returnRows(cod);
  assert.deepEqual([ret.status, ret.refund_status], ["CLOSED", "DUE"], "paid in cash, refunded in cash");
  assert.ok((await offered()).includes(rider.id));

  /* ---------- the texts: every step to the customer (no such account, so SKIPPED), never twice ---------- */
  const texts = async () => (await sql(
    "SELECT template_key, vars->>'update' AS update FROM notifications WHERE vars->>'orderNumber' = 'CHK-CR-2' ORDER BY id"
  )).map((row) => row.update);
  // Three riders sent: the lost-answer one too (its text had already gone out when the job rolled back).
  const expected = ["request received", "approved", ...Array(3).fill("a rider will collect it"), "refund of Rs 20 due"];
  for (const end = Date.now() + 15000; Date.now() < end && (await texts()).length < expected.length; await new Promise((r) => setTimeout(r, 300)));
  assert.deepEqual(await texts(), expected);

  console.log("customerReturns.check.js: all checks passed");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await cleanup();
  process.exit(process.exitCode ?? 0);
}
