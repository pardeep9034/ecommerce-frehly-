import crypto from 'node:crypto';
import exchanges from '../topology/exchanges.js';

const EXCHANGE = exchanges.INVENTORY_EVENTS.name;

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
  INVENTORY_RESERVED: {
    routingKey: 'inventory.reserved',
    exchange: EXCHANGE,
    version: 1,
    /**
     * @param {{ orderId: string|number, items: array }} inventory
     */
    buildPayload(inventory) {
      if (!inventory?.orderId) {
        throw new Error('InventoryReserved payload requires orderId');
      }
      return buildEnvelope('inventory.reserved', 1, {
        orderId: inventory.orderId,
        items: inventory.items,
      });
    },
  },

  INVENTORY_RESERVATION_FAILED: {
    // Triggers compensating action: e.g. Payment service issues a refund
    routingKey: 'inventory.reservation_failed',
    exchange: EXCHANGE,
    version: 1,
    /**
     * @param {{ orderId: string|number, reason: string }} inventory
     */
    buildPayload(inventory) {
      if (!inventory?.orderId) {
        throw new Error('InventoryReservationFailed payload requires orderId');
      }
      return buildEnvelope('inventory.reservation_failed', 1, {
        orderId: inventory.orderId,
        reason: inventory.reason || 'out of stock',
      });
    },
  },
};
