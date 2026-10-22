// Run: docker compose run --rm --no-deps inventory-service node inventorySummary.check.js
// GET /inventory/summary counts each (product, warehouse) row on stock free to sell (current - reserved).
// Writes two CHK-SUM warehouses and their rows, removes them at the end. Dev only.
import assert from "node:assert/strict";
import express from "express";
import jwt from "jsonwebtoken";
import { env } from "./src/config/env.js";
import initializeModels from "./src/models/index.js";
import inventoryRoutes from "./src/modules/inventory/inventory.routes.js";

assert.notEqual(process.env.NODE_ENV, "production", "dev only");

const db = await initializeModels();
const app = express();
app.use(express.json());
app.use("/inventory", inventoryRoutes);
const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
const base = `http://127.0.0.1:${server.address().port}/inventory/summary`;

const token = (role) => `Bearer ${jwt.sign({ user_id: 1, role }, env.JWT_SECRET, { expiresIn: "1m" })}`;
const get = async (query = "", role = "ADMIN") => {
  const res = await fetch(`${base}${query}`, { headers: role ? { authorization: token(role) } : {} });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const cleanup = async () => {
  const ids = (await db.Warehouse.findAll({ where: { code: ["CHK-SUM-1", "CHK-SUM-2"] } })).map((w) => w.id);
  await db.Inventory.destroy({ where: { warehouse_id: ids } });
  await db.Warehouse.destroy({ where: { id: ids } });
};

try {
  await cleanup();
  const before = (await get()).body.data;

  const w1 = await db.Warehouse.create({ code: "CHK-SUM-1", name: "Check summary 1", latitude: 0, longitude: 0 });
  const w2 = await db.Warehouse.create({ code: "CHK-SUM-2", name: "Check summary 2", latitude: 0, longitude: 0 });
  const row = (warehouse, variant_id, current_stock, reserved_stock) =>
    db.Inventory.create({ warehouse_id: warehouse.id, variant_id, current_stock, reserved_stock, low_stock_threshold: 10 });
  await row(w1, 990001, 50, 0); // fine
  await row(w1, 990002, 12, 5); // 7 free: low (12 on the shelf would look fine)
  await row(w1, 990003, 4, 4); // 0 free: out
  await row(w2, 990002, 0, 0); // same product, second warehouse: counts again
  await row(w2, 990003, 3, 0); // low

  assert.equal((await get("", null)).status, 401, "no token");
  assert.equal((await get("", "CUSTOMER")).status, 403, "customer");
  assert.equal((await get("?warehouse_id=abc")).status, 400, "bad warehouse id");

  const one = await get(`?warehouse_id=${w1.id}`);
  assert.equal(one.status, 200, JSON.stringify(one.body));
  assert.deepEqual(one.body.data, { total: 3, low: 1, out: 1, reserved: 9 });
  assert.deepEqual((await get(`?warehouse_id=${w2.id}`, "OPS_STAFF")).body.data, { total: 2, low: 1, out: 1, reserved: 0 });

  const all = (await get("?warehouse_id=")).body.data;
  assert.deepEqual(
    [all.total - before.total, all.low - before.low, all.out - before.out, all.reserved - before.reserved],
    [5, 2, 2, 9],
    "all warehouses add up",
  );
  console.log("inventorySummary.check: ok");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await cleanup();
  server.close();
  process.exit(process.exitCode ?? 0);
}
