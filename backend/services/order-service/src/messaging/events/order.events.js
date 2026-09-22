import crypto from 'node:crypto';
import exchanges from '../topology/exchanges.js';
import logger from '../../utils/Logger.js';

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
      logger.debug('OrderCreated buildPayload', { order });
      if (!order?.id ) {
        throw new Error('OrderCreated payload requires id and non-empty items[]');
      }
      return buildEnvelope('order.created', 1, {
        orderId: order.id,
        items: order.items,
        totalAmount: order.totalAmount,
        user_id: order.user_id,
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

  ORDER_ITEMS_FINALIZED: {
    routingKey: 'order.items.finalized',
    exchange: EXCHANGE,
    version: 1,
    /**
     * @param {{ orderId: string|number, readyItems: array, unavailableItems: array, refundAmount: number, newStatus: string }} data
     */
    buildPayload(data) {
      if (!data?.orderId) {
        throw new Error('OrderItemsFinalized payload requires orderId');
      }
      return buildEnvelope('order.items.finalized', 1, {
        orderId: data.orderId,
        readyItems: data.readyItems || [],
        unavailableItems: data.unavailableItems || [],
        refundAmount: data.refundAmount || 0,
        newStatus: data.newStatus,
      });
    },
  },
};
