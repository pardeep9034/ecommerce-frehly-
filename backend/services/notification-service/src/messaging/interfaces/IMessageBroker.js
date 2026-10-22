/**
 * IMessageBroker
 *
 * This is the contract every broker implementation must follow.
 * Your Publisher and Consumer classes only ever talk to THIS interface,
 * never to RabbitMQBroker/KafkaBroker directly.
 *
 * Why this matters: if you switch from RabbitMQ to Kafka later, you only
 * write a new class that implements these same methods. Publisher.js,
 * Consumer.js, and every service that uses them stay completely untouched.
 *
 * In JS there's no real "interface" keyword, so we enforce the contract
 * by throwing if a subclass forgets to implement a method.
 */
export default class IMessageBroker {
  /**
   * Establish connection to the broker.
   * Must be idempotent — calling connect() multiple times should not
   * create multiple connections (cache the in-flight promise).
   */
  async connect() {
    throw new Error('IMessageBroker.connect() must be implemented');
  }

  /**
   * Gracefully close connection(s).
   */
  async disconnect() {
    throw new Error('IMessageBroker.disconnect() must be implemented');
  }

  /**
   * Ensure an exchange/topic exists.
   * @param {string} name
   * @param {string} type - e.g. 'topic', 'fanout', 'direct'
   * @param {object} options
   */
  async assertExchange(name, type, options) {
    throw new Error('IMessageBroker.assertExchange() must be implemented');
  }

  /**
   * Ensure a queue exists.
   * @param {string} name
   * @param {object} options
   */
  async assertQueue(name, options) {
    throw new Error('IMessageBroker.assertQueue() must be implemented');
  }

  /**
   * Bind a queue to an exchange using a routing key / pattern.
   */
  async bindQueue(queueName, exchangeName, routingKey) {
    throw new Error('IMessageBroker.bindQueue() must be implemented');
  }

  /**
   * Publish a message.
   * @param {string} exchangeName
   * @param {string} routingKey
   * @param {Buffer} content
   * @param {object} options
   */
  async publish(exchangeName, routingKey, content, options) {
    throw new Error('IMessageBroker.publish() must be implemented');
  }

  /**
   * Subscribe to a queue.
   * @param {string} queueName
   * @param {function} onMessage - (msg) => Promise<void>
   * @param {object} options
   */
  async consume(queueName, onMessage, options) {
    throw new Error('IMessageBroker.consume() must be implemented');
  }

  /**
   * Acknowledge successful processing of a message.
   */
  ack(msg) {
    throw new Error('IMessageBroker.ack() must be implemented');
  }

  /**
   * Reject a message. requeue=true puts it back, false sends it to DLQ
   * (if a dead-letter-exchange is configured on the queue).
   */
  nack(msg, requeue) {
    throw new Error('IMessageBroker.nack() must be implemented');
  }
}
