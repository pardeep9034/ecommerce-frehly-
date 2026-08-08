import crypto from 'node:crypto';
import exchanges from '../topology/exchanges.js';

/**
 * order.events.js
 *
 * Catalog of every event Order Service publishes.
 *
 * Two things every event definition carries:
 * 1. routingKey — used by the publisher and must match a binding
 *    in topology/bindings.js, or the message goes nowhere.
 * 2. buildPayload — wraps the raw data with metadata (eventId, timestamp,
 *    version) so every consumer gets a consistent envelope, and so
 *    idempotency checks (via eventId) and schema versioning are possible
 *    from day one, not bolted on later.
 *
 * Naming convention: past tense, one complete fact (atomic — see our
 * earlier discussion). "OrderCreated", never "CreatingOrder".
 */

const EXCHANGE = exchanges.ORDER_EVENTS.name;

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
  ORDER_CREATED: {
    routingKey: 'order.created',
    exchange: EXCHANGE,
    version: 1,
    /**
     * @param {{ id: string|number, items: array, totalAmount: number, customerId: string }} order
     */
    buildPayload(order) {
      if (!order?.id || !order?.items?.length) {
        throw new Error('OrderCreated payload requires id and non-empty items[]');
      }
      return buildEnvelope('order.created', 1, {
        orderId: order.id,
        items: order.items,
        totalAmount: order.totalAmount,
        customerId: order.customerId,
      });
    },
  },

  ORDER_CANCELLED: {
    routingKey: 'order.cancelled',
    exchange: EXCHANGE,
    version: 1,
    /**
     * @param {{ id: string|number, reason: string }} order
     */
    buildPayload(order) {
      if (!order?.id) {
        throw new Error('OrderCancelled payload requires id');
      }
      return buildEnvelope('order.cancelled', 1, {
        orderId: order.id,
        reason: order.reason || 'not specified',
      });
    },
  },
};
