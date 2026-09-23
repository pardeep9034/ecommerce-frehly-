import crypto from "node:crypto";
import IPaymentGateway from "../interfaces/IPaymentGateway.js";
import AppError from "../../utils/AppError.js";

const RAZORPAY_API = "https://api.razorpay.com/v1";

// Razorpay amounts are always in paise (smallest currency unit) — our
// Order/Payment rows store rupees as a decimal, so every amount crosses
// this boundary once on the way out and once on the way back.
const toPaise = (amount) => Math.round(Number(amount) * 100);
const toRupees = (paise) => Number(paise) / 100;

// Razorpay's own event names, normalized to the shape IPaymentGateway
// callers expect. "payment.authorized" is intentionally left unmapped —
// with auto-capture on (the default), "authorized" is followed almost
// immediately by "captured", which is the event that actually means
// "money is ours"; treating "authorized" as success would be premature.
const EVENT_TYPES = {
  "payment.captured": "payment.succeeded",
  "payment.failed": "payment.failed",
  "refund.processed": "refund.processed"
};

/**
 * RazorpayGateway
 *
 * Talks to Razorpay's plain REST API over fetch (no SDK) — same style as
 * every other outbound call in this service (requestInventory, fetchVariant,
 * etc). Razorpay's Node SDK is a thin wrapper around these same endpoints,
 * so nothing is lost by skipping it, and it avoids adding a dependency for
 * what a few fetch calls already do.
 *
 * Standard Checkout note: Razorpay's embedded checkout is a JS modal the
 * frontend opens with { key_id, order_id, amount }, not a hosted URL like
 * some other gateways — so checkoutUrl is always null here; the frontend
 * needs providerSessionId (Razorpay's order id) and the public key_id.
 */
export default class RazorpayGateway extends IPaymentGateway {
  constructor(config = {}) {
    super();
    this.keyId = config.keyId;
    this.keySecret = config.keySecret;
    this.webhookSecret = config.webhookSecret;
  }

  authHeaders() {
    const basic = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
    return { Authorization: `Basic ${basic}`, "Content-Type": "application/json" };
  }

  async createPaymentSession({ orderId, orderNumber, amount, currency = "INR" }) {
    const response = await fetch(`${RAZORPAY_API}/orders`, {
      method: "POST",
      headers: this.authHeaders(),
      body: JSON.stringify({
        amount: toPaise(amount),
        currency,
        receipt: orderNumber,
        // Carries our internal order id through to the webhook — Razorpay's
        // own order/payment ids are theirs, not ours, so this is how
        // parseWebhookEvent finds its way back to the right order.
        notes: { order_id: String(orderId) }
      })
    });

    const raw = await response.json();
    if (!response.ok) {
      throw new AppError(raw?.error?.description || "Razorpay order creation failed", response.status);
    }

    return {
      providerSessionId: raw.id,
      checkoutUrl: null,
      raw
    };
  }

  verifyWebhookSignature(rawBody, signatureHeader) {
    if (!signatureHeader) return false;
    const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : rawBody;
    const expected = crypto.createHmac("sha256", this.webhookSecret).update(bodyString).digest("hex");

    const expectedBuf = Buffer.from(expected, "hex");
    const givenBuf = Buffer.from(signatureHeader, "hex");
    if (expectedBuf.length !== givenBuf.length) return false;

    return crypto.timingSafeEqual(expectedBuf, givenBuf);
  }

  parseWebhookEvent(rawBody) {
    const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : rawBody;
    const body = JSON.parse(bodyString);
    const payment = body?.payload?.payment?.entity;

    return {
      type: EVENT_TYPES[body.event] || body.event,
      orderId: payment?.notes?.order_id ? Number(payment.notes.order_id) : null,
      transactionId: payment?.id,
      amount: payment ? toRupees(payment.amount) : null,
      raw: body
    };
  }

  async refund({ transactionId, amount }) {
    const response = await fetch(`${RAZORPAY_API}/payments/${transactionId}/refund`, {
      method: "POST",
      headers: this.authHeaders(),
      // Omitting amount means "refund the full captured amount" per Razorpay's API.
      body: JSON.stringify(amount ? { amount: toPaise(amount) } : {})
    });

    const raw = await response.json();
    if (!response.ok) {
      throw new AppError(raw?.error?.description || "Razorpay refund failed", response.status);
    }

    return {
      refundId: raw.id,
      status: raw.status === "processed" ? "processed" : raw.status,
      raw
    };
  }
}
