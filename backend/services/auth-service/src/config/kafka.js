import { Kafka } from 'kafkajs';
import { env } from './env.js';

class KafkaManager {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'auth-service',
      brokers: env.KAFKA_BROKERS.split(','),
      retry: {
        initialRetryTime: 300,
        retries: 5,
      },
      // Suppress unnecessary logging
      logLevel: 0,
    });

    this.producer = null;
    this._connecting = false;
    this.consumer = null;
  }

  async connectProducer() {
    if (this.producer) return this.producer;
    if (this._connecting) return null;

    this._connecting = true;
    this.producer = this.kafka.producer();

    try {
      await this.producer.connect();
      console.log('✅ Auth Service: Connected to Kafka Producer');
      this._connecting = false;
      return this.producer;
    } catch (err) {
      // Non-fatal — service runs without Kafka
      console.warn(`⚠️ Kafka not available: ${err.message}`);
      this.producer = null;
      this._connecting = false;
      return null;
    }
  }

  async sendEvent(topic, message, key) {
    // Lazy connect on first use
    if (!this.producer) {
      await this.connectProducer();
    }

    if (!this.producer) {
      // Kafka unavailable — fail silently
      return;
    }

    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
        key,
      });
      console.log(`📡 Event sent to topic: ${topic}`);
    } catch (error) {
      console.warn(`⚠️ Kafka send failed [${topic}]: ${error.message}`);
    }
  }
  async connectConsumer(groupId = "auth-group") {
  if (this.consumer) return this.consumer;

  this.consumer = this.kafka.consumer({ groupId });

  try {
    await this.consumer.connect();
    console.log("✅ Kafka Consumer Connected");
    return this.consumer;
  } catch (err) {
    console.warn(`⚠️ Kafka consumer error: ${err.message}`);
    this.consumer = null;
    return null;
  }
}

  async disconnect() {
    if (this.producer) {
      try {
        await this.producer.disconnect();
      } catch { /* ignore */ }
      this.producer = null;
    }
  }
}

export default new KafkaManager();
