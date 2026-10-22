// Run: docker compose run --rm --no-deps inventory-service node staffOrService.check.js
// Reservation writes accept staff tokens or order-service's internal key, never a customer token alone.
// POST with an empty body: getting past auth ends at validation (400), so nothing is written. Dev only.
import assert from "node:assert/strict";
import express from "express";
import jwt from "jsonwebtoken";
import { env } from "./src/config/env.js";
import reservationRoutes from "./src/modules/stockReservation/stockReservation.routes.js";

assert.notEqual(process.env.NODE_ENV, "production", "dev only");
const KEY = "k".repeat(40);
env.INTERNAL_API_KEY = KEY;

const app = express();
app.use(express.json());
app.use("/stock-reservations", reservationRoutes);
const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
const url = `http://127.0.0.1:${server.address().port}/stock-reservations`;

const token = (role) => `Bearer ${jwt.sign({ user_id: 1, role }, env.JWT_SECRET, { expiresIn: "1m" })}`;
const post = async (headers) => (await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: "{}" })).status;

try {
  assert.equal(await post({}), 401, "no token");
  assert.equal(await post({ authorization: token("CUSTOMER") }), 403, "a customer token alone");
  assert.equal(await post({ authorization: token("DELIVERY_PARTNER") }), 403, "a partner token");
  assert.equal(await post({ "x-internal-key": "wrong" }), 401, "a wrong key");
  assert.equal(await post({ "x-internal-key": "wrong", authorization: token("CUSTOMER") }), 403, "a wrong key does not help a customer");
  assert.equal(await post({ authorization: token("OPS_STAFF") }), 400, "staff get through to validation");
  assert.equal(await post({ "x-internal-key": KEY, authorization: token("CUSTOMER") }), 400, "order-service with the key");
  env.INTERNAL_API_KEY = undefined;
  assert.equal(await post({ "x-internal-key": KEY, authorization: token("CUSTOMER") }), 403, "no configured key: staff only");
  console.log("staffOrService.check: ok");
} finally {
  server.close();
}
