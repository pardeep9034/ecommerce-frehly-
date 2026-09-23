import crypto from "node:crypto";
import IPaymentGateway from "../interfaces/IPaymentGateway.js";

/**
 * MockGateway
 *
 * A working sandbox gateway — no real bank/card network involved, but it
 * implements the full contract for real: signatures are real HMACs,
 * sessions get real ids. This is what lets Phase 3 (order.service.js
 * calling a gateway) get built and tested today, without waiting on
 * choosing and signing up for a real provider (Razorpay/Stripe/etc).
 *
 * It's also the template to copy: a RazorpayGateway/StripeGateway class
 * later just implements these same four methods against the real SDK.
 */
export default class MockGateway extends IPaymentGateway {
  constructor(config = {}) {
    super();
    // A real gateway gives you this secret when you register a webhook
    // URL in their dashboard. Here we just need any shared secret so
    // verifyWebhookSignature has something real to check.
    this.webhookSecret = config.webhookSecret || "mock-dev-webhook-secret";
  }

  async createPaymentSession({ orderId, orderNumber, amount, currency = "INR", paymentMethod }) {
    const providerSessionId = `mock_sess_${crypto.randomBytes(12).toString("hex")}`;

    return {
      providerSessionId,
      checkoutUrl: `https://mock-gateway.local/checkout/${providerSessionId}`,
      raw: { orderId, orderNumber, amount, currency, paymentMethod, providerSessionId }
    };
  }

  /**
   * Signs a JSON string the same way a real gateway signs its webhook
   * body, so a caller (a test, or a local "simulate the gateway" script)
   * can produce a signature that verifyWebhookSignature will accept.
   */
  signEvent(bodyString) {
    return crypto.createHmac("sha256", this.webhookSecret).update(bodyString).digest("hex");
  }

  verifyWebhookSignature(rawBody, signatureHeader) {
    if (!signatureHeader) return false;
    const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : rawBody;
    const expected = this.signEvent(bodyString);

    const expectedBuf = Buffer.from(expected, "hex");
    const givenBuf = Buffer.from(signatureHeader, "hex");
    if (expectedBuf.length !== givenBuf.length) return false;

    return crypto.timingSafeEqual(expectedBuf, givenBuf);
  }

  parseWebhookEvent(rawBody) {
    const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : rawBody;
    const event = JSON.parse(bodyString);

    return {
      type: event.event,
      orderId: event.order_id,
      transactionId: event.transaction_id,
      amount: event.amount,
      raw: event
    };
  }

  async refund({ transactionId, amount }) {
    return {
      refundId: `mock_refund_${crypto.randomBytes(8).toString("hex")}`,
      status: "processed",
      raw: { transactionId, amount, refunded_at: new Date().toISOString() }
    };
  }
}
