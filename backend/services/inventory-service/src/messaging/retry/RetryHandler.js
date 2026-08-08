/**
 * RetryHandler.js
 *
 * RabbitMQ has no built-in "retry this message in 30 seconds" feature.
 * The standard workaround: create a separate "retry queue" with a
 * message TTL (time-to-live). Messages aren't consumed from it directly —
 * they just sit until they EXPIRE, and expiry triggers dead-lettering,
 * which routes them back to the ORIGINAL queue for another attempt.
 *
 * Flow for one failed message:
 *   original_queue -> handler throws -> nack (no requeue)
 *     -> published to retry_queue_5s with x-dead-letter-exchange
 *        pointing back at the original exchange/routing key
 *     -> after 5 seconds, TTL expires -> RabbitMQ dead-letters it
 *     -> lands back in original_queue -> consumer tries again
 *     -> if retry count exceeds max, send to permanent DLQ instead
 *
 * The retry count is tracked in message headers (x-retry-count), which
 * RabbitMQ preserves across dead-lettering (it appends to x-death header
 * array too, but we track our own counter for simplicity).
 */
export default class RetryHandler {
  /**
   * @param {IMessageBroker} broker
   * @param {object} options
   * @param {number} options.maxRetries - default 3
   * @param {number[]} options.backoffMs - delay per retry attempt, e.g. [5000, 15000, 60000]
   */
  constructor(broker, options = {}) {
    this.broker = broker;
    this.maxRetries = options.maxRetries ?? 3;
    this.backoffMs = options.backoffMs ?? [5000, 15000, 60000];
  }

  /**
   * Ensures a retry queue exists for a given delay tier. Called lazily
   * the first time a message needs to retry at that tier.
   */
  async _ensureRetryQueue(originalExchange, originalRoutingKey, delayMs) {
    const retryQueueName = `retry.${delayMs}ms`;

    await this.broker.assertQueue(retryQueueName, {
      durable: true,
      arguments: {
        'x-message-ttl': delayMs,
        'x-dead-letter-exchange': originalExchange,
        'x-dead-letter-routing-key': originalRoutingKey,
      },
    });

    return retryQueueName;
  }

  /**
   * Call this when a consumer's handler throws. Decides whether to
   * schedule a retry or give up and let it fall through to the DLQ.
   *
   * @param {object} msg - the raw amqplib message (has .properties.headers, .content, .fields)
   * @param {string} originalExchange
   * @returns {boolean} true if a retry was scheduled, false if retries exhausted
   */
  async handleFailure(msg, originalExchange) {
    const headers = msg.properties.headers || {};
    const retryCount = headers['x-retry-count'] || 0;

    if (retryCount >= this.maxRetries) {
      console.warn(
        `[RetryHandler] max retries (${this.maxRetries}) exhausted for routing key "${msg.fields.routingKey}". Sending to DLQ.`
      );
      return false; // caller should nack without requeue -> goes to DLQ
    }

    const delayMs = this.backoffMs[retryCount] || this.backoffMs[this.backoffMs.length - 1];
    const retryQueueName = await this._ensureRetryQueue(originalExchange, msg.fields.routingKey, delayMs);

    // Republish directly to the retry queue (default exchange, routing key = queue name)
    await this.broker.publish('', retryQueueName, msg.content, {
      persistent: true,
      headers: { ...headers, 'x-retry-count': retryCount + 1 },
    });

    console.log(
      `[RetryHandler] scheduled retry #${retryCount + 1} for "${msg.fields.routingKey}" in ${delayMs}ms`
    );
    return true;
  }
}
