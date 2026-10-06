import { test } from "node:test";
import assert from "node:assert/strict";
import { validate } from "../src/middleware/validate.js";

// GET /stock-movements?type=&warehouse_id= — a bad enum value would otherwise
// reach Postgres and come back as a 500, so the query is validated first.

const run = (query) => {
  let result = "next";
  const res = { status: (code) => ({ json: (payload) => (result = { code, payload }) }) };
  validate("listStockMovementsSchema", "query")({ query }, res, () => {});
  return result;
};

test("accepts no filters, valid filters, and empty strings from a form", () => {
  assert.equal(run({}), "next");
  assert.equal(run({ page: "2", limit: "10", type: "SALE", warehouse_id: "3" }), "next");
  assert.equal(run({ type: "", warehouse_id: "" }), "next");
});

test("rejects an unknown type and a non-numeric or non-positive warehouse_id", () => {
  assert.equal(run({ type: "REFUND" }).code, 400);
  assert.equal(run({ warehouse_id: "abc" }).code, 400);
  assert.equal(run({ warehouse_id: "0" }).code, 400);
});
