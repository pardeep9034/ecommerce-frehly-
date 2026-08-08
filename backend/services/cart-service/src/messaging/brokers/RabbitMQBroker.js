import amqp from 'amqplib';
import IMessageBroker from '../interfaces/IMessageBroker.js';
import defaultConfig from '../rabbitmq.config.js';

/**
 * RabbitMQBroker
 *
 * Concrete implementation of IMessageBroker for RabbitMQ.
 *
 * Key design decisions:
 * 1. Connection + channel are cached as an in-flight PROMISE, not just the
 *    resolved value. If two services call connect() before the first
 *    connection finishes, both await the SAME promise instead of racing
 *    to open two connections.
 * 2. Auto-reconnect on connection loss, so a broker restart doesn't
 *    permanently kill your service.
 * 3. Channel is separate from Connection — one connection can have many
 *    channels (cheap, lightweight), so we keep one channel per broker
 *    instance and reuse it.
 *
 * All defaults below come from rabbitmq.config.js. Passing an explicit
 * `config` object here (e.g. in tests) overrides those defaults on a
 * per-field basis.
 */
export default class RabbitMQBroker extends IMessageBroker {
  constructor(config = {}) {
    super();
    const merged = { ...defaultConfig, ...config };

    this.url = merged.url;
    this.connection = null;
    this.channel = null;

    // Caches the in-flight connect() promise itself, not the resolved value.
    // This is what actually prevents the race condition.
    this._connectingPromise = null;

    this.reconnectDelayMs = merged.reconnectDelayMs;
    this.prefetchCount = merged.prefetchCount;
    this.heartbeatSec = merged.heartbeatSec;
    this.publisherConfirms = merged.publisherConfirms;
  }

  async connect() {
    // Already connected — return immediately.
    if (this.channel) return this.channel;

    // A connection attempt is already in flight — return the SAME promise
    // instead of starting a second connection attempt.
    if (this._connectingPromise) return this._connectingPromise;

    this._connectingPromise = this._doConnect();

    try {
      return await this._connectingPromise;
    } finally {
      // Clear the in-flight marker once it settles (success or failure)
      // so a future call can retry cleanly if it failed.
      this._connectingPromise = null;
    }
  }

  async _doConnect() {
    this.connection = await amqp.connect(this.url, { heartbeat: this.heartbeatSec });

    this.connection.on('error', (err) => {
      console.error('[RabbitMQBroker] connection error:', err.message);
    });

    this.connection.on('close', () => {
      console.warn('[RabbitMQBroker] connection closed. Reconnecting...');
      this.channel = null;
      this.connection = null;
      setTimeout(() => this.connect().catch(() => {}), this.reconnectDelayMs);
    });

    // Confirm channel makes publish() resolve only once the broker has
    // actually persisted the message — safer for financial events
    // (payments), controlled via rabbitmq.config.js publisherConfirms.
    this.channel = this.publisherConfirms
      ? await this.connection.createConfirmChannel()
      : await this.connection.createChannel();

    await this.channel.prefetch(this.prefetchCount);

    console.log(
      `[RabbitMQBroker] connected to ${this.url} (prefetch: ${this.prefetchCount}, confirms: ${this.publisherConfirms})`
    );
    return this.channel;
  }

  async disconnect() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    this.channel = null;
    this.connection = null;
  }

  async assertExchange(name, type = 'topic', options = { durable: true }) {
    const channel = await this.connect();
    await channel.assertExchange(name, type, options);
  }

  async assertQueue(name, options = { durable: true }) {
    const channel = await this.connect();
    const q = await channel.assertQueue(name, options);
    return q;
  }

  async bindQueue(queueName, exchangeName, routingKey) {
    const channel = await this.connect();
    await channel.bindQueue(queueName, exchangeName, routingKey);
  }

  async publish(exchangeName, routingKey, content, options = {}) {
    const channel = await this.connect();
    return channel.publish(exchangeName, routingKey, content, {
      persistent: true,
      ...options,
    });
  }

  async consume(queueName, onMessage, options = {}) {
    const channel = await this.connect();

    await channel.consume(
      queueName,
      async (msg) => {
        if (!msg) return; // consumer cancelled by server
        try {
          await onMessage(msg);
        } catch (err) {
          // Safety net: if a handler forgets its own try/catch, we still
          // nack instead of crashing the whole process or losing the msg.
          console.error(`[RabbitMQBroker] unhandled error on queue "${queueName}":`, err.message);
          this.nack(msg, false); // don't requeue — let DLQ handle it
        }
      },
      { noAck: false, ...options }
    );
  }

  ack(msg) {
    if (this.channel) this.channel.ack(msg);
  }

  nack(msg, requeue = false) {
    if (this.channel) this.channel.nack(msg, false, requeue);
  }
}
