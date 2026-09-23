import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import RazorpayGateway from "../src/payment/gateways/RazorpayGateway.js";

// createPaymentSession/refund need a live network call to Razorpay's API —
// no test creds/sandbox wired here, so only the pure logic (signature
// check, webhook normalization) is covered, same limitation already noted
// for the DB-touching tests elsewhere in this service.

test("verifyWebhookSignature accepts Razorpay's real signing scheme (HMAC-SHA256 hex)", () => {
  const gateway = new RazorpayGateway({ webhookSecret: "whsec_test" });
  const body = JSON.stringify({ event: "payment.captured" });
  const signature = crypto.createHmac("sha256", "whsec_test").update(body).digest("hex");

  assert.equal(gateway.verifyWebhookSignature(body, signature), true);
});

test("verifyWebhookSignature rejects a body signed with the wrong secret", () => {
  const gateway = new RazorpayGateway({ webhookSecret: "whsec_test" });
  const body = JSON.stringify({ event: "payment.captured" });
  const wrongSignature = crypto.createHmac("sha256", "some-other-secret").update(body).digest("hex");

  assert.equal(gateway.verifyWebhookSignature(body, wrongSignature), false);
});

test("parseWebhookEvent normalizes payment.captured, converts paise to rupees, and recovers our order id from notes", () => {
  const gateway = new RazorpayGateway();
  const body = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_Iabc123",
          amount: 50000,
          notes: { order_id: "42" }
        }
      }
    }
  });

  const parsed = gateway.parseWebhookEvent(body);

  assert.equal(parsed.type, "payment.succeeded");
  assert.equal(parsed.orderId, 42);
  assert.equal(parsed.transactionId, "pay_Iabc123");
  assert.equal(parsed.amount, 500);
});

test("parseWebhookEvent normalizes payment.failed", () => {
  const gateway = new RazorpayGateway();
  const body = JSON.stringify({
    event: "payment.failed",
    payload: { payment: { entity: { id: "pay_xyz", amount: 500, notes: { order_id: "7" } } } }
  });

  assert.equal(gateway.parseWebhookEvent(body).type, "payment.failed");
});
