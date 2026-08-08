import RetryHandler from '../retry/RetryHandler.js';

/**
 * Consumer.js
 *
 * The ONLY class your services should use to consume events. It wraps
 * your business logic handler with:
 *   - automatic JSON parsing of the envelope built by Publisher
 *   - try/catch safety net (a thrown error doesn't crash the process)
 *   - retry scheduling via RetryHandler (exponential backoff)
 *   - fallback to DLQ once retries are exhausted
 *
 * What YOUR handler is responsible for:
 *   - idempotency (check eventId before acting, since at-least-once
 *     delivery means the same event can arrive more than once)
 *   - the actual business logic
 *
 * Example usage from Inventory Service:
 *
 *   import { consumer } from '../messaging/index.js';
 *   import queues from '../messaging/topology/queues.js';
 *
 *   await consumer.subscribe(queues.INVENTORY_ORDER_QUEUE.name, async (event) => {
 *     const already = await ProcessedEvent.findOne({ where: { eventId: event.eventId } });
 *     if (already) return;
 *     await reserveStock(event.data);
 *     await ProcessedEvent.create({ eventId: event.eventId });
 *   });
 */
export default class Consumer {
  /**
   * @param {IMessageBroker} broker
   * @param {object} [retryOptions] - passed to RetryHandler
   */
  constructor(broker, retryOptions = {}) {
    this.broker = broker;
    this.retryHandler = new RetryHandler(broker, retryOptions);
  }

  /**
   * @param {string} queueName
   * @param {function} handler - async (parsedEventPayload, rawMsg) => void
   * @param {object} [options] - { exchangeForRetry: string } - which exchange
   *   to dead-letter back to on retry (needed since the queue itself
   *   doesn't know which exchange originally routed to it)
   */
  async subscribe(queueName, handler, options = {}) {
    await this.broker.consume(queueName, async (msg) => {
      let payload;

      try {
        payload = JSON.parse(msg.content.toString());
      } catch (err) {
        console.error(`[Consumer] malformed JSON on queue "${queueName}", sending straight to DLQ`);
        this.broker.nack(msg, false);
        return;
      }

      try {
        await handler(payload, msg);
        this.broker.ack(msg);
      } catch (err) {
        console.error(
          `[Consumer] handler failed for event "${payload.eventType || 'unknown'}" on queue "${queueName}":`,
          err.message
        );

        const originalExchange = options.exchangeForRetry || msg.fields.exchange;
        const retryScheduled = await this.retryHandler.handleFailure(msg, originalExchange);

        // Whether retried or exhausted, we ack the ORIGINAL message here —
        // the retry queue now holds a fresh copy (with incremented retry
        // count), or nack(false) below sends it to the permanent DLQ.
        if (retryScheduled) {
          this.broker.ack(msg);
        } else {
          this.broker.nack(msg, false); // exhausted -> permanent DLQ
        }
      }
    });

    console.log(`[Consumer] subscribed to queue "${queueName}"`);
  }
}
