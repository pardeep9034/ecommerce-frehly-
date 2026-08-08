/**
 * exchanges.js
 *
 * Single source of truth for every exchange in the system.
 * Adding a new exchange means adding one entry here — not hunting through
 * every service file for a scattered assertExchange() call.
 */
export default {
  ORDER_EVENTS: {
    name: 'order_events',
    type: 'topic', // pattern-based routing, e.g. "order.*"
    options: { durable: true },
  },
  PAYMENT_EVENTS: {
    name: 'payment_events',
    type: 'topic',
    options: { durable: true },
  },
  INVENTORY_EVENTS: {
    name: 'inventory_events',
    type: 'topic',
    options: { durable: true },
  },
  USER_EVENTS: {
    name: 'user_events',
    type: 'topic',
    options: { durable: true },
  },

  // Dedicated exchange that dead-lettered messages get routed through.
  // Queues reference this via `x-dead-letter-exchange` in queues.js.
  DEAD_LETTER: {
    name: 'dead_letter_exchange',
    type: 'fanout', // broadcast — every DLQ bound here gets a copy
    options: { durable: true },
  },
};
