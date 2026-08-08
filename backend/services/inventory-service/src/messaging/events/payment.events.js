import crypto from 'node:crypto';
import exchanges from '../topology/exchanges.js';

const EXCHANGE = exchanges.PAYMENT_EVENTS.name;

function buildEnvelope(eventType, version, data) {
  return {
    eventId: crypto.randomUUID(),
    eventType,
    version,
    occurredAt: new Date().toISOString(),
    data,
  };
}

export default {
  PAYMENT_CHARGED: {
    routingKey: 'payment.charged',
    exchange: EXCHANGE,
    version: 1,
    /**
     * @param {{ orderId: string|number, amount: number, transactionId: string }} payment
     */
    buildPayload(payment) {
      if (!payment?.orderId || !payment?.transactionId) {
        throw new Error('PaymentCharged payload requires orderId and transactionId');
      }
      return buildEnvelope('payment.charged', 1, {
        orderId: payment.orderId,
        amount: payment.amount,
        transactionId: payment.transactionId,
      });
    },
  },

  PAYMENT_FAILED: {
    routingKey: 'payment.failed',
    exchange: EXCHANGE,
    version: 1,
    /**
     * @param {{ orderId: string|number, reason: string }} payment
     */
    buildPayload(payment) {
      if (!payment?.orderId) {
        throw new Error('PaymentFailed payload requires orderId');
      }
      return buildEnvelope('payment.failed', 1, {
        orderId: payment.orderId,
        reason: payment.reason || 'unknown',
      });
    },
  },

  PAYMENT_REFUNDED: {
    // Compensating action event, used in the Saga pattern when a later
    // step (e.g. inventory reservation) fails and payment must be undone.
    routingKey: 'payment.refunded',
    exchange: EXCHANGE,
    version: 1,
    /**
     * @param {{ orderId: string|number, transactionId: string }} payment
     */
    buildPayload(payment) {
      if (!payment?.orderId || !payment?.transactionId) {
        throw new Error('PaymentRefunded payload requires orderId and transactionId');
      }
      return buildEnvelope('payment.refunded', 1, {
        orderId: payment.orderId,
        transactionId: payment.transactionId,
      });
    },
  },
};
