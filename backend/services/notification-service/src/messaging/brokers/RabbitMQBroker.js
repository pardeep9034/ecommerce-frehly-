import amqp from 'amqplib';
import IMessageBroker from '../interfaces/IMessageBroker.js';
import defaultConfig from '../rabbitmq.config.js';
import logger from '../../utils/Logger.js';

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
 * 2. Crash-only on a lost connection or channel. A service that consumes
 *    exits, and compose's `restart: always` brings it back with its
 *    consumers (an in-place reconnect used to drop them silently). A
 *    publish-only service drops the dead connection and reconnects on its
 *    next publish, so its HTTP side keeps working while the broker is down.
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

    this._consuming = false;
    this._closing = false;

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
    const connection = await amqp.connect(this.url, { heartbeat: this.heartbeatSec });

    // Confirm channel makes publish() resolve only once the broker has
    // actually persisted the message, controlled via rabbitmq.config.js publisherConfirms.
    const channel = this.publisherConfirms
      ? await connection.createConfirmChannel()
      : await connection.createChannel();

    // 'error' is always followed by 'close', and a dead connection closes its channel too:
    // the identity check makes only the first of those events act.
    const lost = (what) => (err) => {
      if (this._closing || this.connection !== connection) return;
      this.connection = null;
      this.channel = null;
      const reason = err?.message ? `: ${err.message}` : '';
      if (this._consuming) {
        logger.error(`[RabbitMQBroker] ${what} lost${reason}. Exiting so the restart brings the consumers back`);
        process.exit(1);
      }
      logger.warn(`[RabbitMQBroker] ${what} lost${reason}. The next publish reconnects`);
      connection.close().catch(() => {});
    };
    connection.on('error', lost('connection'));
    connection.on('close', lost('connection'));
    channel.on('error', lost('channel'));
    channel.on('close', lost('channel'));

    await channel.prefetch(this.prefetchCount);
    this.connection = connection;
    this.channel = channel;

    logger.info(
      `[RabbitMQBroker] connected to ${this.url.replace(/\/\/[^@/]*@/, '//***@')} (prefetch: ${this.prefetchCount}, confirms: ${this.publisherConfirms})`
    );
    return channel;
  }

  async disconnect() {
    this._closing = true;
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
    const publishOptions = { persistent: true, ...options };
    if (!this.publisherConfirms) return channel.publish(exchangeName, routingKey, content, publishOptions);

    // amqplib calls back once the broker acks (or nacks) the message, and with an error for
    // every unconfirmed message when the channel closes, so this cannot wait forever.
    await new Promise((resolve, reject) => {
      channel.publish(exchangeName, routingKey, content, publishOptions, (err) => (err ? reject(err) : resolve()));
    });
    return true;
  }

  async consume(queueName, onMessage, options = {}) {
    const channel = await this.connect();
    this._consuming = true;

    await channel.consume(
      queueName,
      async (msg) => {
        if (!msg) return; // consumer cancelled by server
        try {
          await onMessage(msg);
        } catch (err) {
          // Safety net: if a handler forgets its own try/catch, we still
          // nack instead of crashing the whole process or losing the msg.
          logger.error(`[RabbitMQBroker] unhandled error on queue "${queueName}":`, err.message);
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
