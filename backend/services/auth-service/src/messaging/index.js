import RabbitMQBroker from './brokers/RabbitMQBroker.js';
import Publisher from './publisher/Publisher.js';
import Consumer from './consumer/Consumer.js';
import exchanges from './topology/exchanges.js';
import queues from './topology/queues.js';
import bindings from './topology/bindings.js';
import { setupDeadLetterInfrastructure } from './dlq/DeadLetterSetup.js';
import config from './rabbitmq.config.js';

/**
 * messaging/index.js
 *
 * The single entry point every service imports:
 *
 *   import { publisher, consumer, initializeTopology } from './messaging/index.js';
 *
 *   await initializeTopology(); // once, on service startup
 *   await publisher.publish(OrderEvents.ORDER_CREATED, orderData);
 *   await consumer.subscribe(queues.INVENTORY_ORDER_QUEUE.name, handler);
 *
 * Swapping brokers later (Kafka, NATS) means changing ONE line below —
 * everything else in every service stays the same, because Publisher and
 * Consumer only depend on the IMessageBroker interface, not on RabbitMQ
 * specifics.
 */

// --- Broker selection ---
// This is the one line you'd change to swap RabbitMQ for Kafka/NATS later.
// No config values are hardcoded here anymore — everything (url, prefetch,
// heartbeat, reconnect delay, retry backoff) comes from rabbitmq.config.js,
// which itself switches on NODE_ENV. Override any single field by passing
// it explicitly, e.g. new RabbitMQBroker({ prefetchCount: 1 }) in a test.
export const broker = new RabbitMQBroker();

export const publisher = new Publisher(broker);
export const consumer = new Consumer(broker, {
  maxRetries: config.maxRetries,
  backoffMs: config.backoffMs,
});

console.log(`[messaging] initialized for NODE_ENV="${config.envirnmont}"`);

/**
 * Declares every exchange, queue, and binding from topology/*.js against
 * the broker. Idempotent — safe to call on every service startup, since
 * assertExchange/assertQueue/bindQueue are no-ops if already declared
 * identically.
 *
 * Call this ONCE per service, before publishing or subscribing.
 */
export async function initializeTopology() {
  await broker.connect();

  await setupDeadLetterInfrastructure(broker);

  for (const exchangeDef of Object.values(exchanges)) {
    if (exchangeDef.name === exchanges.DEAD_LETTER.name) continue; // already set up above
    await broker.assertExchange(exchangeDef.name, exchangeDef.type, exchangeDef.options);
  }

  for (const queueDef of Object.values(queues)) {
    if (queueDef.name === queues.DEAD_LETTER_QUEUE.name) continue; // already set up above
    await broker.assertQueue(queueDef.name, queueDef.options);
  }

  for (const binding of bindings) {
    if (binding.exchange === exchanges.DEAD_LETTER.name) continue; // already bound above
    await broker.bindQueue(binding.queue, binding.exchange, binding.routingKey);
  }

  console.log('[messaging] topology initialized: exchanges, queues, and bindings are ready');
}
