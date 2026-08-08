import IMessageBroker from '../interfaces/IMessageBroker.js';

/**
 * KafkaBroker (future)
 *
 * Placeholder implementation. When you're ready to add Kafka support,
 * implement each method below using kafkajs, matching the exact same
 * method signatures as RabbitMQBroker. Because Publisher.js and
 * Consumer.js only depend on IMessageBroker, switching brokers is just:
 *
 *   const broker = new KafkaBroker(config); // instead of RabbitMQBroker
 *
 * Nothing else in the codebase changes.
 *
 * Mapping notes for whoever implements this later:
 * - RabbitMQ "exchange"      -> roughly maps to a Kafka "topic" (no direct
 *                                exchange concept in Kafka)
 * - RabbitMQ "queue"         -> roughly maps to a Kafka "consumer group"
 *                                reading a topic
 * - RabbitMQ "routing key"   -> roughly maps to a Kafka "partition key"
 * - RabbitMQ ack/nack        -> Kafka uses "commit offset" instead
 */
export default class KafkaBroker extends IMessageBroker {
  constructor(config = {}) {
    super();
    this.config = config;
    throw new Error('KafkaBroker is not implemented yet. Use RabbitMQBroker for now.');
  }
}
