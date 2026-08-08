# Messaging Module

Broker-agnostic event messaging for the microservices. RabbitMQ is the
current implementation; Kafka/NATS can be added later without touching
any service code, because everything goes through the `IMessageBroker`
interface.

## Install

In each service that needs messaging:

```bash
npm install amqplib
```

Copy this whole `messaging/` folder into each service (or, better,
publish it as a private npm package shared across services so all
copies stay in sync).

## Environment variable

```
RABBITMQ_URL=amqp://user:password@your-rabbitmq-host:5672
```

## One-time setup per service

```js
const { initializeTopology } = require('./messaging');

await initializeTopology(); // declares all exchanges/queues/bindings — idempotent, safe to call every boot
```

## Publishing an event

```js
const { publisher } = require('./messaging');
const OrderEvents = require('./messaging/events/order.events');

await publisher.publish(OrderEvents.ORDER_CREATED, {
  id: order.id,
  items: order.items,
  totalAmount: order.total,
  customerId: order.customerId,
});
```

## Consuming an event

```js
const { consumer } = require('./messaging');
const queues = require('./messaging/topology/queues');

await consumer.subscribe(queues.INVENTORY_ORDER_QUEUE.name, async (event) => {
  // ALWAYS check idempotency first — at-least-once delivery means
  // the same event can arrive more than once.
  const already = await ProcessedEvent.findOne({ where: { eventId: event.eventId } });
  if (already) return;

  await reserveStock(event.data);

  await ProcessedEvent.create({ eventId: event.eventId });
});
```

Retries (exponential backoff: 5s -> 15s -> 60s) and dead-lettering to
`dead_letter_queue` after 3 failed attempts happen automatically — you
don't write any retry code in your handler. Just throw on failure and
the Consumer wrapper handles the rest.

## Adding a new event

1. Add the event definition to the relevant file in `events/` (or
   create a new `<domain>.events.js` file).
2. Add a queue for the new consumer in `topology/queues.js`.
3. Add a binding in `topology/bindings.js` connecting the event's
   routing key to the new queue.
4. Call `consumer.subscribe(...)` in the consuming service.

The publishing service never needs to change when you add a new
consumer for an event it already publishes — that's the whole point
of the exchange/binding layer.

## Folder structure

```
messaging/
├── brokers/          RabbitMQBroker (active), Kafka/NATS (stubs for later)
├── interfaces/        IMessageBroker — the contract all brokers implement
├── publisher/          Publisher — the only class services use to emit events
├── consumer/           Consumer — the only class services use to receive events
├── topology/           exchanges.js, queues.js, bindings.js — declarative config
├── events/             Event catalogs per domain (order, payment, inventory)
├── retry/              RetryHandler — TTL + dead-letter based exponential backoff
├── dlq/                Dead letter exchange/queue setup + inspection helper
├── examples/           Working two-service example (Order -> Inventory)
└── index.js            Wires everything together, single entry point
```

## Design notes worth remembering

- **Connection caching**: `RabbitMQBroker.connect()` caches the
  in-flight promise, not just the resolved connection — prevents two
  simultaneous callers from opening duplicate connections (same race
  condition fix pattern used in your singleton initialization code).
- **Idempotency is the consumer's job, not the broker's.** RabbitMQ
  guarantees at-least-once delivery, never exactly-once. Always check
  `event.eventId` against a processed-events table before acting.
- **Outbox pattern still applies.** This module handles the messaging
  layer, but you still need to write the event to an outbox table in
  the same DB transaction as your business data, then have a
  poller/worker call `publisher.publish(...)` — otherwise a crash
  between your DB write and the publish call loses the event.
