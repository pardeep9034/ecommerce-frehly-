import MockGateway from "./gateways/MockGateway.js";
import RazorpayGateway from "./gateways/RazorpayGateway.js";
import { env } from "../config/env.js";

/**
 * payment/index.js
 *
 * The single entry point order.service.js (and later, a webhook route)
 * imports:
 *
 *   import { paymentGateway } from '../../payment/index.js';
 *
 *   const session = await paymentGateway.createPaymentSession({ ... });
 *   const ok = paymentGateway.verifyWebhookSignature(rawBody, signature);
 *
 * Swapping providers later (Razorpay, Stripe) means adding one new class
 * under gateways/ that extends IPaymentGateway, and changing the ONE line
 * below — nothing that calls paymentGateway needs to change, because it
 * only depends on the IPaymentGateway interface, not on MockGateway
 * specifics.
 */

// --- Gateway selection ---
// This is the one line you'd change to swap the mock for a real provider.
// PAYMENT_GATEWAY defaults to "mock" (see config/env.js) until a real
// provider is chosen and its own Gateway class exists.
const gateways = {
  mock: MockGateway,
  razorpay: RazorpayGateway
};

const GatewayClass = gateways[env.PAYMENT_GATEWAY] || MockGateway;

export const paymentGateway = new GatewayClass({
  webhookSecret: env.PAYMENT_WEBHOOK_SECRET,
  keyId: env.RAZORPAY_KEY_ID,
  keySecret: env.RAZORPAY_KEY_SECRET
});
