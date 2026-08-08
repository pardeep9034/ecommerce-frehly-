import exchanges from './exchanges.js';

/**
 * queues.js
 *
 * Single source of truth for every queue in the system.
 *
 * Every queue below is wired with:
 *  - x-dead-letter-exchange: where a message goes after it's rejected
 *    (nack'd without requeue) or expires — this is what makes the DLQ work.
 *  - x-dead-letter-routing-key: the routing key used when re-publishing
 *    to the dead letter exchange (helps identify which queue it came from).
 *  - x-message-ttl: optional, used by retry queues (see retry/ folder) to
 *    auto-expire a message after N ms, which triggers dead-lettering —
 *    this is the trick RabbitMQ uses to fake "delayed retry" since it has
 *    no native delay/scheduling feature.
 */
export default {
  INVENTORY_ORDER_QUEUE: {
    name: 'inventory_order_queue',
    options: {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': exchanges.DEAD_LETTER.name,
        'x-dead-letter-routing-key': 'inventory_order_queue.dead',
      },
    },
  },

  EMAIL_ORDER_QUEUE: {
    name: 'email_order_queue',
    options: {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': exchanges.DEAD_LETTER.name,
        'x-dead-letter-routing-key': 'email_order_queue.dead',
      },
    },
  },

  PAYMENT_QUEUE: {
    name: 'payment_queue',
    options: {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': exchanges.DEAD_LETTER.name,
        'x-dead-letter-routing-key': 'payment_queue.dead',
      },
    },
  },

  // The actual DLQ — where dead-lettered messages end up for inspection.
  // Not consumed automatically; a human or a reprocessing job checks this.
  DEAD_LETTER_QUEUE: {
    name: 'dead_letter_queue',
    options: { durable: true },
  },
};
