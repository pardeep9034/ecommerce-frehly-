import exchanges from './exchanges.js';
import queues from './queues.js';

/**
 * bindings.js
 *
 * Single source of truth for how exchanges connect to queues.
 * Each entry answers: "messages published to WHICH exchange, with WHAT
 * routing key pattern, land in WHICH queue?"
 *
 * This is what lets you add a new consumer for an existing event without
 * touching the publisher at all — you just add a new binding entry here
 * plus a new queue in queues.js.
 */
export default [
  // Bind only events intake.js has a handler for. delivery-service's events come over HTTP instead.
  {
    exchange: exchanges.ORDER_EVENTS.name,
    queue: queues.NOTIFICATION_QUEUE.name,
    routingKey: 'order.status.changed',
  },
  {
    exchange: exchanges.PAYMENT_EVENTS.name,
    queue: queues.NOTIFICATION_QUEUE.name,
    routingKey: 'payment.failed',
  },
  {
    exchange: exchanges.INVENTORY_EVENTS.name,
    queue: queues.NOTIFICATION_QUEUE.name,
    routingKey: 'warehouse.status.changed',
  },

  // Every service-specific queue's dead-letter routing key binds into the
  // single shared dead_letter_queue, so all failures land in one place.
  {
    exchange: exchanges.DEAD_LETTER.name,
    queue: queues.DEAD_LETTER_QUEUE.name,
    routingKey: '', // fanout ignores routing key, but bindQueue needs a string
  },
];
