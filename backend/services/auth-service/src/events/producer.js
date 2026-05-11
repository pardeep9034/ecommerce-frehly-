// src/events/producer.js

import crypto          from 'crypto';
import kafkaManager    from '../config/kafka.js';
import { TOPICS }      from './topics.js';
// import { logger }      from '../utils/Logger.js';

/**
 * Standard envelope around every event.
 * Every service in the ecosystem sends this same shape.
 *
 * {
 *   eventId:   "uuid",           ← for deduplication in consumers
 *   service:   "auth-service",   ← which service published this
 *   topic:     "user.registered",
 *   timestamp: "2025-04-09T...",
 *   payload:   { ...your data }  ← actual business data
 * }
 */
async function emitEvent(topic, payload, key) {
  const envelope = {
    eventId:   crypto.randomUUID(),
    service:   'auth-service',
    topic,
    timestamp: new Date().toISOString(),
    payload,
  };

  // key routes all events for the same user to the same Kafka partition
  // this guarantees ordering — user.registered always before user.verified
  await kafkaManager.sendEvent(topic, envelope, key);
}

export { emitEvent, TOPICS };