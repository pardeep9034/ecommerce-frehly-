import { test } from "node:test";
import assert from "node:assert/strict";
import MockGateway from "../src/payment/gateways/MockGateway.js";

// Structure step (pre-Phase 3): guards the one part of the gateway
// abstraction that's actual logic, not a stub — HMAC signature
// verification. If this regresses, a forged webhook could be trusted.

test("createPaymentSession returns a session id and checkout url", async () => {
  const gateway = new MockGateway();
  const session = await gateway.createPaymentSession({
    orderId: 1,
    orderNumber: "ORD-1",
    amount: 500,
    paymentMethod: "UPI"
  });

  assert.ok(session.providerSessionId.startsWith("mock_sess_"));
  assert.ok(session.checkoutUrl.includes(session.providerSessionId));
});

test("verifyWebhookSignature accepts a correctly signed body", () => {
  const gateway = new MockGateway({ webhookSecret: "test-secret" });
  const body = JSON.stringify({ event: "payment.succeeded", order_id: 1, transaction_id: "tx_1", amount: 500 });
  const signature = gateway.signEvent(body);

  assert.equal(gateway.verifyWebhookSignature(body, signature), true);
});

test("verifyWebhookSignature rejects a tampered body", () => {
  const gateway = new MockGateway({ webhookSecret: "test-secret" });
  const body = JSON.stringify({ event: "payment.succeeded", order_id: 1, transaction_id: "tx_1", amount: 500 });
  const signature = gateway.signEvent(body);
  const tampered = JSON.stringify({ event: "payment.succeeded", order_id: 1, transaction_id: "tx_1", amount: 999999 });

  assert.equal(gateway.verifyWebhookSignature(tampered, signature), false);
});

test("verifyWebhookSignature rejects a missing signature", () => {
  const gateway = new MockGateway({ webhookSecret: "test-secret" });
  assert.equal(gateway.verifyWebhookSignature("{}", undefined), false);
});

test("parseWebhookEvent normalizes the mock event shape", () => {
  const gateway = new MockGateway();
  const body = JSON.stringify({ event: "payment.succeeded", order_id: 42, transaction_id: "tx_42", amount: 500 });

  const parsed = gateway.parseWebhookEvent(body);

  assert.equal(parsed.type, "payment.succeeded");
  assert.equal(parsed.orderId, 42);
  assert.equal(parsed.transactionId, "tx_42");
});

test("refund returns a processed status", async () => {
  const gateway = new MockGateway();
  const refund = await gateway.refund({ transactionId: "tx_42", amount: 500 });

  assert.equal(refund.status, "processed");
  assert.ok(refund.refundId.startsWith("mock_refund_"));
});
