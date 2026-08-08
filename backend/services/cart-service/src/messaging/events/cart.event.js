import exchanges from '../topology/exchanges.js';
import crypto from 'crypto';
const EXCHANGE = exchanges.CART_EVENTS.name;

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
    CART_ITEM_REMOVED:{
        routingKey: 'cart.item.removed',
        exchange: EXCHANGE,
        version: 1,
        buildPayload(cartItems) {
            return buildEnvelope('CART_ITEM_REMOVED', 1, { cartItems });
        }
    }
}