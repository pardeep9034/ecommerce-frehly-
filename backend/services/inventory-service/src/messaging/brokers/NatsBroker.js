import IMessageBroker from '../interfaces/IMessageBroker.js';

/**
 * NatsBroker (future)
 *
 * Placeholder implementation. Implement using the `nats` npm package,
 * matching IMessageBroker's method signatures exactly.
 *
 * Mapping notes:
 * - RabbitMQ "exchange + routing key" -> roughly maps to NATS "subject"
 *   (e.g. "order.created" as a subject, using NATS wildcard subscriptions
 *   for pattern matching, similar to topic exchanges)
 * - RabbitMQ "queue"                  -> maps to a NATS "queue group"
 *   (multiple consumers in the same queue group load-balance messages,
 *   same effect as multiple consumers on one RabbitMQ queue)
 * - NATS JetStream (not core NATS) is what gives you durability/ack,
 *   comparable to RabbitMQ's persistent messages + manual ack
 */
export default class NatsBroker extends IMessageBroker {
  constructor(config = {}) {
    super();
    this.config = config;
    throw new Error('NatsBroker is not implemented yet. Use RabbitMQBroker for now.');
  }
}
