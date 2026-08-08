import crypto from 'node:crypto';
import exchanges from '../topology/exchanges.js';

const EXCHANGE = exchanges.USER_EVENTS.name;


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
  USER_LOGGED_IN: {
    routingKey: 'user.logged_in',
    exchange: EXCHANGE,
    version: 1,
    buildPayload(data) {
    //   if (!user?.id) {
    //     throw new Error('UserLoggedIn payload requires id');
    //   }
      return buildEnvelope('user.logged_in', 1, {
        user_id: data.user_id,
        guest_cart: data.guest_cart,
        warehouse_id: data.warehouse_id
      });
    }
}
}