import { test } from "node:test";
import assert from "node:assert/strict";
import orderService from "../src/modules/order/order.service.js";

// Phase 3: the webhook route has no auth middleware (the gateway has no
// user JWT) — verifyWebhookSignature is the ONLY thing standing between an
// anonymous POST and marking someone's order as paid. These two tests
// guard that the signature check runs, and runs BEFORE anything else
// (no DB lookup, no state change) — a forged/missing signature must be
// rejected on its own, independent of whether the referenced order exists.

test("a webhook with a forged signature is rejected before touching the DB", async () => {
  await assert.rejects(
    () => orderService.processPaymentWebhook(
      '{"event":"payment.succeeded","order_id":1,"transaction_id":"tx_1","amount":500}',
      "0000000000000000000000000000000000000000000000000000000000000000"
    ),
    /Invalid webhook signature/
  );
});

test("a webhook with no signature header is rejected", async () => {
  await assert.rejects(
    () => orderService.processPaymentWebhook(
      '{"event":"payment.succeeded","order_id":1,"transaction_id":"tx_1","amount":500}',
      undefined
    ),
    /Invalid webhook signature/
  );
});
