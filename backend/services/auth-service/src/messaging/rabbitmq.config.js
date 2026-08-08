/**
 * rabbitmq.config.js
 *
 * Single source of truth for every tunable RabbitMQ setting: connection
 * details, prefetch, heartbeat, reconnect behavior, and retry/backoff
 * defaults.
 *
 * WHY THIS FILE EXISTS:
 * Before this, RabbitMQBroker.js and RetryHandler.js each had their own
 * hardcoded defaults (prefetch: 10, backoff: [5000, 15000, 60000], etc.)
 * baked directly into the class constructors. That's fine for one
 * service, but once you have Order, Inventory, Payment, and Email
 * services all using this module, you don't want to hunt through 4
 * copies of RabbitMQBroker.js to change the prefetch count or point
 * staging at a different host.
 *
 * Now every setting lives here, changes based on NODE_ENV, and every
 * other file in messaging/ imports FROM this file instead of defining
 * its own defaults.
 */
import { env } from "../config/env.js";

const envirnmont = env.NODE_ENV || 'development';

/**
 * Base settings shared across all environments.
 * Environment-specific blocks below only override what's different.
 */
const base = {
  // --- Connection ---
  url: env.RABBITMQ_URL || 'amqp://localhost:5672',

  // How long (ms) to wait before trying to reconnect after the
  // connection drops (broker restart, network blip, etc.)
  reconnectDelayMs: 3000,

  // AMQP heartbeat interval (seconds). If no heartbeat is seen for
  // 2x this interval, the connection is considered dead and closed —
  // this is what actually triggers the 'close' event and reconnect logic.
  heartbeatSec: 30,

  // --- Consumer behavior ---
  // How many unacknowledged messages a consumer can hold at once.
  // Lower = safer (less lost work if the process crashes) but more
  // round-trips to the broker. Higher = better throughput, more risk.
  prefetchCount: 10,

  // --- Retry / backoff (used by retry/RetryHandler.js) ---
  maxRetries: 3,
  backoffMs: [5000, 15000, 60000], // 5s, 15s, 60s

  // --- Publish confirmation ---
  // If true, uses a confirm channel so publish() only resolves once
  // the broker has actually persisted the message (safer, slightly
  // slower). Recommended true for anything financial (Payment service).
  publisherConfirms: true,
};

/**
 * Per-environment overrides. Only list what actually differs from base.
 */
const overrides = {
  development: {
    url: env.RABBITMQ_URL || 'amqp://localhost:5672',
    prefetchCount: 5,
    publisherConfirms: false, // faster local iteration, less strict
  },

  test: {
    url: env.RABBITMQ_URL || 'amqp://localhost:5672',
    prefetchCount: 1, // easier to reason about ordering in tests
    reconnectDelayMs: 500,
    maxRetries: 1,
    backoffMs: [100],
    publisherConfirms: false,
  },

  staging: {
    url: env.RABBITMQ_URL, // must be set via env in staging
    prefetchCount: 10,
    publisherConfirms: true,
  },

  production: {
    url: env.RABBITMQ_URL, // must be set via env in production
    prefetchCount: 20,
    reconnectDelayMs: 5000,
    maxRetries: 5,
    backoffMs: [5000, 15000, 60000, 300000, 900000], // up to 15 min
    publisherConfirms: true,
  },
};

const config = {
  ...base,
  ...(overrides[envirnmont] || {}),
  envirnmont,
};

// Fail fast in staging/production if no URL was actually provided —
// better to crash on startup than silently fall back to localhost
// and have every publish() call hang or throw in production.
if ((envirnmont === 'staging' || envirnmont === 'production') && !config.url) {
  throw new Error(
    `[rabbitmq.config] RABBITMQ_URL environment variable is required in "${envirnmont}" but was not set.`
  );
}

export default config;
