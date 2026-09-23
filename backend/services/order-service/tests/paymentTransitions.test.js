import { test } from "node:test";
import assert from "node:assert/strict";
import orderService from "../src/modules/order/order.service.js";

// Phase 2: guards the payment-failure/expiry-retry cycle's state machine.
// No DB/broker needed — assertTransition is pure.

test("a failed payment can be retried back to pending payment", () => {
  assert.doesNotThrow(() => orderService.assertTransition("PAYMENT_FAILED", "PENDING_PAYMENT"));
});

test("an expired payment can be retried back to pending payment", () => {
  assert.doesNotThrow(() => orderService.assertTransition("PAYMENT_EXPIRED", "PENDING_PAYMENT"));
});

test("a delivered order cannot re-enter the payment retry cycle", () => {
  assert.throws(
    () => orderService.assertTransition("DELIVERED", "PENDING_PAYMENT"),
    /Invalid status transition/
  );
});

test("a pending-payment order cannot jump straight to delivered", () => {
  assert.throws(
    () => orderService.assertTransition("PENDING_PAYMENT", "DELIVERED"),
    /Invalid status transition/
  );
});
