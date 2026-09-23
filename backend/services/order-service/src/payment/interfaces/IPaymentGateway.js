/**
 * IPaymentGateway
 *
 * The contract every payment gateway implementation must follow.
 * order.service.js will only ever talk to THIS interface, never to
 * MockGateway/RazorpayGateway/StripeGateway directly.
 *
 * Why this matters: swapping providers later means writing one new class
 * that implements these same four methods. order.service.js, the payment
 * routes, and everything else stay untouched — same pattern as
 * messaging/interfaces/IMessageBroker.js for RabbitMQ.
 *
 * In JS there's no real "interface" keyword, so the contract is enforced
 * by throwing if a subclass forgets to implement a method.
 */
export default class IPaymentGateway {
  /**
   * Start a payment on the gateway's side for one order (the "payment
   * intent" / "checkout session" step — see the "Payment Gateways,
   * Explained Simply" doc). Called from createOrder/retryPayment instead
   * of hand-building payment_session locally.
   * @param {{ orderId: string|number, orderNumber: string, amount: number, currency: string, paymentMethod: string }} params
   * @returns {Promise<{ providerSessionId: string, checkoutUrl: string|null, raw: object }>}
   */
  async createPaymentSession(params) {
    throw new Error("IPaymentGateway.createPaymentSession() must be implemented");
  }

  /**
   * Verify that a webhook actually came from the gateway (HMAC signature
   * check against the raw, unparsed request body). Must run BEFORE
   * parseWebhookEvent/trusting the payload — this is what stops anyone
   * from POSTing a fake "payment succeeded" event.
   * @param {string|Buffer} rawBody - the exact bytes the gateway sent, unparsed
   * @param {string} signatureHeader
   * @returns {boolean}
   */
  verifyWebhookSignature(rawBody, signatureHeader) {
    throw new Error("IPaymentGateway.verifyWebhookSignature() must be implemented");
  }

  /**
   * Turn a verified webhook body into the shape order.service.js expects,
   * regardless of what the underlying gateway calls its fields.
   * @param {string|Buffer} rawBody
   * @returns {{ type: 'payment.succeeded'|'payment.failed'|'refund.processed', orderId: string|number, transactionId: string, amount: number, raw: object }}
   */
  parseWebhookEvent(rawBody) {
    throw new Error("IPaymentGateway.parseWebhookEvent() must be implemented");
  }

  /**
   * Refund a previously successful transaction on the gateway's side.
   * @param {{ transactionId: string, amount: number }} params
   * @returns {Promise<{ refundId: string, status: string, raw: object }>}
   */
  async refund(params) {
    throw new Error("IPaymentGateway.refund() must be implemented");
  }
}
