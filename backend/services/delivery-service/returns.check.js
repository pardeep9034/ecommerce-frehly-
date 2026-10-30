// Live check of goods coming back to the store (returns phases 1 and 2): a refused drop is never sent again, a rider
// holding goods gets no new orders, the store takes them back with the rider's return code, and a returned order is
// cancelled with its stock split; at the door the customer's delivery code, turned-away items (photo first), their
// check-in and inspection; and pay on delivery (the QR, Retry, Switch to cash, cash).
// Service and order-service must be running, dev only. Run: docker compose exec -T delivery-service node returns.check.js
// Uses a fake partner 994001 and makes orders named CHK-RT-n; removes them all before and after. Nothing is restocked
// (every line is written off), so inventory is never touched.
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { env } from "./src/config/env.js";
import initializeModels from "./src/models/index.js";
import DeliveryPartnerService from "./src/modules/deliveryPartner/deliveryPartner.service.js";
import * as storage from "./src/utils/storage.js";
import { pickupCode } from "./src/utils/pickupCode.js";

assert.notEqual(env.NODE_ENV, "production", "dev only");

const RIDER_USER = 994001;
const STAFF_USER = 994999;
const tokenFor = (userId, role) => jwt.sign({ user_id: userId, phone: `99900${userId}`, role }, env.JWT_SECRET, { expiresIn: "5m" });
const tokenRider = tokenFor(RIDER_USER, "DELIVERY_PARTNER");
const tokenAdmin = tokenFor(STAFF_USER, "ADMIN");
const other = (code) => String((Number(code) + 1) % 10000).padStart(4, "0");

const request = async (url, method, token, json) => {
  const headers = { authorization: `Bearer ${token}` };
  if (json !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(url, { method, headers, body: json === undefined ? undefined : JSON.stringify(json) });
  return { status: res.status, body: await res.json().catch(() => null) };
};
const me = (method, path, json) => request(`http://localhost:${env.PORT}/delivery-partners/me${path}`, method, tokenRider, json);
const dispatch = (method, path, json) => request(`http://localhost:${env.PORT}/handle-orders${path}`, method, tokenAdmin, json);
const orders = (method, path, json) => request(`${env.ORDER_SERVICE_URL}${path}`, method, tokenAdmin, json);

const db = await initializeModels();
const sql = async (query, replacements = {}) => (await db.sequelize.query(query, { replacements }))[0];

const cleanup = async () => {
  const partners = "SELECT id FROM delivery_partners WHERE user_id = :user";
  const r = { user: RIDER_USER };
  for (const { door_photo_key } of await sql(`SELECT door_photo_key FROM delivery_assignments WHERE delivery_partner_id IN (${partners}) AND door_photo_key IS NOT NULL`, r)) {
    await storage.remove(door_photo_key);
  }
  await sql(`DELETE FROM delivery_attempts WHERE delivery_partner_id IN (${partners})`, r);
  await sql(`DELETE FROM delivery_status_history WHERE delivery_partner_id IN (${partners})`, r);
  await sql(`DELETE FROM delivery_assignment_history WHERE assignment_id IN (SELECT id FROM delivery_assignments WHERE delivery_partner_id IN (${partners}))`, r);
  await sql(`DELETE FROM delivery_assignments WHERE delivery_partner_id IN (${partners})`, r);
  await sql(`DELETE FROM delivery_partner_zones WHERE delivery_partner_id IN (${partners})`, r);
  await sql("DELETE FROM delivery_partners WHERE user_id = :user", r);
  await sql("DELETE FROM orders WHERE order_number LIKE 'CHK-RT-%'");
};
await cleanup();

try {
  /* ---------- fixtures: one online rider, three orders out for delivery (one prepaid, two cash on delivery) ---------- */
  const rider = await db.DeliveryPartner.create({
    user_id: RIDER_USER, name: "Check Rider", phone: `99900${RIDER_USER}`, vehicle_type: "Motorbike", vehicle_number: "CHKRT1",
    max_active_orders: 4, current_active_orders: 3, status: "ACTIVE", zone_id: 1, joined_at: new Date(), is_online: true, online_since: new Date(),
  });
  await db.DeliveryPartnerZone.create({ delivery_partner_id: rider.id, zone_id: 1, is_primary: true });

  // Potato 2 x 10 and Onion 1 x 10: 30 in all.
  const makeOrder = async (n, cod) => {
    const [{ id }] = await sql(
      `INSERT INTO orders (order_number, user_id, warehouse_id, status, subtotal, total_amount, payment_status, created_at, updated_at)
       VALUES (:num, 994900, 1, 'OUT_FOR_DELIVERY', 30, 30, :paid, now(), now()) RETURNING id`, { num: `CHK-RT-${n}`, paid: "SUCCESS" });
    await sql(
      `INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, unit, quantity, mrp, selling_price, line_total, status, created_at)
       VALUES (:id, 1, 1, 'Potato', 'Potato - kg', 'kg', 2, 10, 10, 20, 'READY', now()),
              (:id, 2, 2, 'Onion', 'Onion - kg', 'kg', 1, 10, 10, 10, 'READY', now())`, { id });
    await sql(
      `INSERT INTO payments (order_id, payment_method, amount, status, created_at) VALUES (:id, :method, 30, :status, now())`,
      { id, method: cod ? "COD" : "UPI", status: "SUCCESS" }); // checkout records COD as SUCCESS too
    return Number(id);
  };
  const [prepaid, cod, refused] = [await makeOrder(1, false), await makeOrder(2, true), await makeOrder(3, true)];
  const items = async (orderId) => (await sql("SELECT id, product_name FROM order_items WHERE order_id = :orderId ORDER BY id", { orderId })).map((r) => Number(r.id));
  const orderRow = async (id) => (await sql("SELECT status, collected_method, collected_amount FROM orders WHERE id = :id", { id }))[0];
  const returnRows = (orderId) => sql("SELECT * FROM order_returns WHERE order_id = :orderId ORDER BY id", { orderId });
  const assignmentRow = async (id) => (await sql("SELECT * FROM delivery_assignments WHERE id = :id", { id }))[0];

  const makeAssignment = async (order_id) => {
    const assignment = await db.DeliveryAssignment.create({
      order_id, warehouse_id: 1, delivery_partner_id: rider.id, status: "ACTIVE", assigned_at: new Date(),
      pickup_name: "Check store", pickup_address: "1 Store Road", pickup_contact_phone: "9990000001",
      customer_name: "Check Customer", customer_phone: "9990000002", delivery_address: "2 Home Street",
    });
    await db.DeliveryStatusHistory.create({ order_id, delivery_partner_id: rider.id, status: "OUT_FOR_DELIVERY" });
    return assignment;
  };
  const [aPrepaid, aCod, aRefused] = [await makeAssignment(prepaid), await makeAssignment(cod), await makeAssignment(refused)];
  const offered = async () => (await DeliveryPartnerService.getAllDeliveryPartnersByZoneId(1)).map((p) => p.id);
  assert.ok((await offered()).includes(rider.id), "a rider holding nothing is offered");

  /* ---------- a refused drop: goods owed back, the rider blocked, no second attempt ---------- */
  const failed = await me("PATCH", `/assignments/${aRefused.id}/status`, { status: "DELIVERY_FAILED", reason_code: "REFUSED" });
  assert.equal(failed.status, 200, JSON.stringify(failed.body));
  assert.equal((await orderRow(refused)).status, "DELIVERY_FAILED");
  assert.ok((await assignmentRow(aRefused.id)).return_due_at, "the goods are owed to the store");
  const due = (await me("GET", "/")).body.data.returns_due;
  assert.deepEqual(due.map((r) => [r.assignment_id, r.kind, r.return_code]), [[aRefused.id, "FAILED_DELIVERY", pickupCode(aRefused.id, "return")]]);
  assert.ok(!(await offered()).includes(rider.id), "a rider holding goods is not offered");

  const byOrder = (await dispatch("GET", `/assignments/by-order/${refused}`)).body.data;
  assert.deepEqual([byOrder.can_retry, byOrder.return_due, byOrder.last_failure.reason_code], [false, true, "REFUSED"]);
  const retry = await dispatch("POST", "/assignments/assign", { order_id: refused, delivery_partner_id: rider.id, assignment_source: "MANUAL" });
  assert.equal(retry.status, 409, `refused is never sent again: ${JSON.stringify(retry.body)}`);

  assert.ok((await dispatch("GET", "/returns-due")).body.data.some((r) => r.assignment_id === aRefused.id), "the store sees it coming back");
  assert.equal((await dispatch("POST", `/assignments/${aRefused.id}/returned`, { return_code: other(pickupCode(aRefused.id, "return")) })).status, 400, "wrong return code");
  assert.equal((await orderRow(refused)).status, "DELIVERY_FAILED", "a wrong code moves nothing");
  const back = await dispatch("POST", `/assignments/${aRefused.id}/returned`, { return_code: pickupCode(aRefused.id, "return") });
  assert.equal(back.status, 200, JSON.stringify(back.body));
  assert.equal((await orderRow(refused)).status, "RETURNED_TO_STORE");
  assert.ok((await assignmentRow(aRefused.id)).returned_at);
  assert.equal((await dispatch("POST", `/assignments/${aRefused.id}/returned`, { return_code: pickupCode(aRefused.id, "return") })).status, 409, "taken back once");
  assert.ok((await offered()).includes(rider.id), "back to taking orders");

  // Cancelled with every line written off: the stock split is recorded, nothing was charged (cash on delivery).
  const [rp, ro] = await items(refused);
  const cancel = await orders("PATCH", `/${refused}/cancel`, {
    reason: "Refused at the door", cancelled_by: "ADMIN",
    items: [{ order_item_id: rp, restock_qty: 0, write_off_qty: 2 }, { order_item_id: ro, restock_qty: 0, write_off_qty: 1 }],
  });
  assert.equal(cancel.status, 200, JSON.stringify(cancel.body));
  assert.equal((await orderRow(refused)).status, "CANCELLED");
  assert.deepEqual((await returnRows(refused)).map((r) => [r.source, r.status, Number(r.write_off_qty), r.refund_status]),
    [["FAILED_DELIVERY", "CLOSED", 2, "NOT_NEEDED"], ["FAILED_DELIVERY", "CLOSED", 1, "NOT_NEEDED"]]);

  /* ---------- at the door, prepaid: the code, one potato turned away, the photo first ---------- */
  const [pp] = await items(prepaid);
  const reject = [{ order_item_id: pp, quantity: 1, reason: "DAMAGED" }];
  const deliver = (assignment, orderId, extra) =>
    me("PATCH", `/assignments/${assignment.id}/status`, { status: "DELIVERED", delivery_code: pickupCode(orderId, "delivery"), ...extra });
  assert.equal((await deliver(aPrepaid, prepaid, { delivery_code: other(pickupCode(prepaid, "delivery")) })).status, 400, "wrong delivery code");
  assert.equal((await deliver(aPrepaid, prepaid, { rejected_items: reject })).status, 400, "turned-away items need a photo");
  assert.equal((await deliver(aPrepaid, prepaid, { rejected_items: [{ order_item_id: pp, quantity: 3, reason: "DAMAGED" }] })).status, 400, "more than was ordered");

  // A 1x1 PNG.
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  const form = new FormData();
  form.append("file", new Blob([png], { type: "image/png" }), "door.png");
  const photo = await fetch(`http://localhost:${env.PORT}/delivery-partners/me/assignments/${aPrepaid.id}/door-photo`, {
    method: "POST", headers: { authorization: `Bearer ${tokenRider}` }, body: form,
  });
  assert.equal(photo.status, 200, await photo.text());
  assert.equal((await me("GET", `/assignments/${aPrepaid.id}`)).body.data.door.has_photo, true);

  const delivered = await deliver(aPrepaid, prepaid, { rejected_items: reject });
  assert.equal(delivered.status, 200, JSON.stringify(delivered.body));
  assert.equal((await orderRow(prepaid)).status, "DELIVERED", "stays delivered with items turned away");
  let [door] = await returnRows(prepaid);
  assert.deepEqual([door.source, door.status, Number(door.quantity), door.reason, Number(door.refund_amount), door.refund_status],
    ["DOORSTEP", "IN_TRANSIT", 1, "DAMAGED", 10, "PENDING"]);
  assert.ok((await assignmentRow(aPrepaid.id)).return_due_at, "the turned-away potato is owed to the store");
  assert.ok(!(await offered()).includes(rider.id), "blocked again while holding it");

  const photoRes = await fetch(`http://localhost:${env.PORT}/handle-orders/assignments/${aPrepaid.id}/door-photo`, { headers: { authorization: `Bearer ${tokenAdmin}` } });
  assert.deepEqual([photoRes.status, photoRes.headers.get("content-type")], [200, "image/png"], "staff see the photo");

  assert.equal((await dispatch("POST", `/assignments/${aPrepaid.id}/returned`, { return_code: pickupCode(aPrepaid.id, "return") })).status, 200);
  [door] = await returnRows(prepaid);
  assert.equal(door.status, "RECEIVED");
  assert.ok((await orders("GET", "/returns?status=RECEIVED")).body.data.some((r) => Number(r.id) === Number(door.id)), "listed to check");

  assert.equal((await orders("PATCH", `/${prepaid}/returns/inspect`, { items: [{ return_id: Number(door.id), restock_qty: 1, write_off_qty: 1 }] })).status, 400, "the split must add up");
  const inspected = await orders("PATCH", `/${prepaid}/returns/inspect`, { items: [{ return_id: Number(door.id), restock_qty: 0, write_off_qty: 1 }] });
  assert.equal(inspected.status, 200, JSON.stringify(inspected.body));
  [door] = await returnRows(prepaid);
  assert.equal(door.status, "CLOSED");
  // The fixture's payment has no gateway id, so the refund itself can't go through: it's recorded as FAILED, never lost.
  assert.ok(["SENT", "FAILED"].includes(door.refund_status), door.refund_status);
  assert.ok((await offered()).includes(rider.id));

  /* ---------- pay on delivery: the QR, Retry, Switch to cash ---------- */
  const view = (await me("GET", `/assignments/${aCod.id}`)).body.data.door;
  assert.deepEqual([view.pay_at_door, view.amount_due, view.paid_by_upi], [true, 30, false]);
  assert.equal((await deliver(aCod, cod, {})).status, 400, "say how the customer paid");
  assert.equal((await deliver(aCod, cod, { payment_method: "UPI" })).status, 409, "no QR was paid");

  const qr = await me("POST", `/assignments/${aCod.id}/door-qr`, { rejected_items: [] });
  if (qr.status === 200) {
    assert.deepEqual([qr.body.data.paid, Number(qr.body.data.qr.amount)], [false, 30]);
    assert.ok(qr.body.data.qr.image_url);
    assert.equal((await me("GET", `/assignments/${aCod.id}/door-qr`)).body.data.paid, false);
    const again = await me("POST", `/assignments/${aCod.id}/door-qr`, { rejected_items: [] });
    assert.equal(again.status, 200, JSON.stringify(again.body));
    assert.notEqual(again.body.data.qr.id, qr.body.data.qr.id, "Retry makes a new QR");
    const closed = await me("DELETE", `/assignments/${aCod.id}/door-qr`);
    assert.deepEqual([closed.status, closed.body.data.paid, closed.body.data.qr], [200, false, null], "Switch to cash closes it");
  } else {
    // ponytail: Razorpay test keys without the QR Codes feature answer 400 here; enable it on the account to cover this.
    console.warn(`door QR skipped: ${qr.status} ${qr.body?.message}`);
  }

  const cash = await deliver(aCod, cod, { payment_method: "CASH" });
  assert.equal(cash.status, 200, JSON.stringify(cash.body));
  const paid = await orderRow(cod);
  assert.deepEqual([paid.status, paid.collected_method, Number(paid.collected_amount)], ["DELIVERED", "CASH", 30]);
  assert.equal((await assignmentRow(aCod.id)).return_due_at, null, "nothing turned away, nothing owed");

  console.log("returns.check.js: all checks passed");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await cleanup();
  process.exit(process.exitCode ?? 0);
}
