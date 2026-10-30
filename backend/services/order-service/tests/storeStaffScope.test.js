import { test } from "node:test";
import assert from "node:assert/strict";
import orderService from "../src/modules/order/order.service.js";
import OrderRepository from "../src/modules/repository/order.repository.js";

// Store staff (OPS_STAFF) only see and change their own store's orders: the warehouse_id in their token.
// No DB/broker needed — the list query is captured from a stubbed repository.

const staff = { user_id: 9, role: "OPS_STAFF", warehouse_id: 7 };
const order = (warehouse_id) => ({ id: 1, user_id: 50, warehouse_id });

test("store staff can open their own store's order", () => {
  assert.doesNotThrow(() => orderService.validateOrderAccess(order(7), staff));
});

test("store staff cannot open another store's order", () => {
  assert.throws(() => orderService.validateOrderAccess(order(8), staff), /do not have access/);
});

test("store staff without a store in their token are refused", () => {
  assert.throws(() => orderService.validateOrderAccess(order(7), { user_id: 9, role: "OPS_STAFF" }), /No store/);
  assert.throws(() => orderService.validateOrderAccess(order(7), { ...staff, warehouse_id: null }), /No store/);
});

test("admins and the order's customer are unchanged", () => {
  assert.doesNotThrow(() => orderService.validateOrderAccess(order(8), { user_id: 1, role: "ADMIN" }));
  assert.doesNotThrow(() => orderService.validateOrderAccess(order(8), { user_id: 50, role: "CUSTOMER" }));
  assert.throws(() => orderService.validateOrderAccess(order(8), { user_id: 51, role: "CUSTOMER" }), /do not have access/);
});

test("packing: own store only, READY_FOR_ASSIGNMENT only, stamps packed_at", async (t) => {
  let saved;
  let current = { ...order(7), status: "READY_FOR_ASSIGNMENT" };
  t.mock.method(OrderRepository, "getOrderById", async () => current);
  t.mock.method(OrderRepository, "updateOrder", async (_id, data) => { saved = data; });
  t.mock.method(orderService, "getOrderDetails", async () => saved);

  const result = await orderService.packOrder(1, { bag_count: 2, rack_label: "" }, staff);
  assert.equal(result.bag_count, 2);
  assert.equal(result.rack_label, null, "an empty rack is stored as no rack");
  assert.ok(result.packed_at instanceof Date);

  current = { ...order(8), status: "READY_FOR_ASSIGNMENT" };
  await assert.rejects(orderService.packOrder(1, { bag_count: 2 }, staff), /do not have access/);

  current = { ...order(7), status: "PLACED" };
  await assert.rejects(orderService.packOrder(1, { bag_count: 2 }, staff), /Cannot pack/);
});

// Needs the DB for the (empty) transaction; run inside the container.
test("store staff can't set PICKED_UP themselves: the hand-over comes as SYSTEM after the pickup code", async (t) => {
  let current;
  t.mock.method(OrderRepository, "getOrderById", async () => current);
  t.mock.method(OrderRepository, "updateOrder", async () => {});
  t.mock.method(orderService, "recordStatusChange", async () => {});
  t.mock.method(orderService, "getOrderDetails", async () => current);
  const move = (from, to, user = staff) => {
    current = { ...order(7), status: from };
    return orderService.updateOrderStatus(1, { status: to }, user);
  };

  await assert.rejects(move("ASSIGNED", "PICKED_UP"), /pickup code/);
  await assert.doesNotReject(move("READY_FOR_ASSIGNMENT", "ASSIGNED"));
  await assert.doesNotReject(move("HANDOVER_IN_PROGRESS", "PICKED_UP"), "calling off a rider-to-rider handover");
  await assert.doesNotReject(move("ASSIGNED", "PICKED_UP", { user_id: "system", role: "SYSTEM" }));
});

test("the order list is forced to the staff member's store", async (t) => {
  let where;
  t.mock.method(OrderRepository, "getOrderHistory", async (w) => {
    where = w;
    return { count: 0, rows: [] };
  });

  await orderService.getAllOrders({ warehouse_id: "8", user_id: "50" }, staff);
  assert.equal(where.warehouse_id, 7, "another store's id is replaced");

  await orderService.getAllOrders({ user_id: "50" }, staff);
  assert.equal(where.warehouse_id, 7, "a customer's orders can't be listed across stores");

  await orderService.getAllOrders({ warehouse_id: "8" }, { user_id: 1, role: "ADMIN" });
  assert.equal(where.warehouse_id, 8, "admins still pick the store");
});
