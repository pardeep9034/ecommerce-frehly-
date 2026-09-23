import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Phase 2: guards against the stock-reservation oversell race regressing.
// A real concurrency proof needs a live Postgres (two overlapping
// transactions); without that infra here, this checks the one thing that
// actually causes the regression: the FOR UPDATE lock silently dropped from
// the read-then-write in stockReservation.service.js.

const serviceFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src/modules/stockReservation/stockReservation.service.js"
);
const source = readFileSync(serviceFile, "utf8");

test("createStockReservation locks the inventory row before writing reserved_stock", () => {
  const start = source.indexOf("async createStockReservation");
  const end = source.indexOf("async confirmStockReservation");
  assert.ok(start >= 0 && end > start, "createStockReservation method not found");

  const body = source.slice(start, end);
  assert.match(
    body,
    /lock:\s*transaction\.LOCK\.UPDATE/,
    "missing FOR UPDATE lock on the inventory read — concurrent reservations can oversell stock"
  );
});

test("updateReservationStatus locks both the reservation and inventory rows it reads", () => {
  const start = source.indexOf("async updateReservationStatus");
  assert.ok(start >= 0, "updateReservationStatus method not found");

  const body = source.slice(start);
  const lockCount = (body.match(/lock:\s*transaction\.LOCK\.UPDATE/g) || []).length;
  assert.equal(
    lockCount,
    2,
    "expected a FOR UPDATE lock on both the reservation read and the inventory read"
  );
});
