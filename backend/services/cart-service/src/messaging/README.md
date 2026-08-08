# Order Service Messaging

This folder provides event-based communication for the Order Service. It
currently uses RabbitMQ, but the application code is separated from RabbitMQ
through the `IMessageBroker` contract. Publishers and consumers therefore use
the same API if a Kafka or NATS broker is implemented later.

All JavaScript in this folder uses ES modules. Local imports must include the
`.js` extension.

## What this module does

- Connects to RabbitMQ and keeps one reusable channel.
- Declares the exchanges, queues, and bindings defined in `topology/`.
- Builds a standard event envelope and publishes persistent messages.
- Parses messages and invokes a service-provided consumer handler.
- Retries failed handlers with RabbitMQ TTL queues.
- Routes malformed or permanently failed messages to the dead-letter queue
  (DLQ).

## Folder structure

```text
messaging/
├── index.js                    Public entry point; creates broker, publisher and consumer
├── rabbitmq.config.js          Environment-specific RabbitMQ settings
├── brokers/
│   ├── RabbitMQBroker.js       Active RabbitMQ implementation
│   ├── KafkaBroker.js          Future placeholder
│   └── NatsBroker.js           Future placeholder
├── interfaces/
│   └── IMessageBroker.js       Broker contract used by Publisher and Consumer
├── topology/
│   ├── exchanges.js            Exchange definitions
│   ├── queues.js               Queue and DLQ definitions
│   └── bindings.js             Exchange-to-queue routes
├── events/                     Event definitions and payload validation
├── publisher/Publisher.js      Event publishing API
├── consumer/Consumer.js        Event consumption, acknowledgement and failure handling
├── retry/RetryHandler.js       Delayed retry implementation
├── dlq/DeadLetterSetup.js      DLX/DLQ creation and inspection utility
└── examples/                   Order publisher and Inventory consumer examples
```

## Startup flow

Call `initializeTopology()` once during service startup, before publishing or
subscribing. It is idempotent, so it is safe for every service instance to call
it on boot.

```js
import { initializeTopology } from './src/messaging/index.js';

await initializeTopology();
```

The function performs this sequence:

```text
initializeTopology()
  -> broker.connect()
  -> create dead_letter_exchange and dead_letter_queue
  -> create order_events, payment_events and inventory_events exchanges
  -> create application queues
  -> bind queues to exchanges with their routing keys
```

RabbitMQ declarations are safe to repeat when their definitions have not
changed. The broker caches an in-progress connection, preventing concurrent
startup calls from opening duplicate connections.

## Topology

| Exchange | Type | Routes to |
| --- | --- | --- |
| `order_events` | `topic` | `order.created` -> `inventory_order_queue`, `email_order_queue`; `order.cancelled` -> `email_order_queue` |
| `payment_events` | `topic` | `payment.*` -> `payment_queue` |
| `inventory_events` | `topic` | Defined and ready for inventory event bindings |
| `dead_letter_exchange` | `fanout` | `dead_letter_queue` |

The normal queues are durable and are configured with
`x-dead-letter-exchange: dead_letter_exchange`. A rejected message that is not
requeued therefore reaches `dead_letter_queue`, where it can be inspected or
reprocessed manually.

## Publishing an event

Import the public publisher and the event catalog. Each event definition
provides the exchange, routing key, version, and `buildPayload()` validation.

```js
import { publisher } from './src/messaging/index.js';
import OrderEvents from './src/messaging/events/order.events.js';

await publisher.publish(OrderEvents.ORDER_CREATED, {
  id: order.id,
  items: order.items,
  totalAmount: order.totalAmount,
  customerId: order.customerId,
});
```

`Publisher.publish()` validates/builds the payload, wraps it in a JSON buffer,
and publishes it as a persistent RabbitMQ message. Event payloads use this
shape:

```js
{
  eventId: 'UUID',
  eventType: 'order.created',
  version: 1,
  occurredAt: '2026-07-31T10:00:00.000Z',
  data: { /* event-specific data */ }
}
```

Available event catalogs are `order.events.js`, `payment.events.js`, and
`inventory.events.js`.

## Consuming an event

Subscribe using a queue from `topology/queues.js`. The handler receives the
parsed event envelope and the original RabbitMQ message.

```js
import { consumer } from './src/messaging/index.js';
import queues from './src/messaging/topology/queues.js';

await consumer.subscribe(
  queues.INVENTORY_ORDER_QUEUE.name,
  async (event) => {
    // Store/check eventId before changing business state.
    const alreadyProcessed = await ProcessedEvent.findOne({
      where: { eventId: event.eventId },
    });
    if (alreadyProcessed) return;

    await reserveStock(event.data);
    await ProcessedEvent.create({ eventId: event.eventId });
  }
);
```

On success, `Consumer` acknowledges the message. If JSON cannot be parsed, it
rejects the message immediately to the DLQ. If the handler throws, it starts
the retry process described below.

### Idempotency is required

RabbitMQ delivery is at least once. A message can be delivered more than once,
for example when a process stops after completing business work but before its
acknowledgement reaches RabbitMQ. Each consumer must use `event.eventId` to
avoid applying the same business operation twice.

## Retry and dead-letter flow

The default development retry configuration is three retries with delays of 5
seconds, 15 seconds, and 60 seconds. `RetryHandler` creates retry queues only
when they are first needed.

```text
Message arrives at application queue
  -> handler succeeds -> ack

  -> handler throws
     -> publish a copy to retry.<delay>ms with x-retry-count + 1
     -> ack the original message
     -> retry queue TTL expires
     -> RabbitMQ routes it to the original exchange/routing key
     -> message is delivered again

  -> retries exhausted, or payload is invalid
     -> nack without requeue
     -> dead_letter_exchange
     -> dead_letter_queue
```

The retry number is stored in the message header `x-retry-count`. Once the
configured maximum is reached, the original message is rejected without
requeueing and becomes a permanent DLQ message.

To inspect messages programmatically, use the helper. It reads messages with
`noAck: true`, so it removes the returned messages from the DLQ.

```js
import { inspectDeadLetterQueue } from './src/messaging/dlq/DeadLetterSetup.js';
import { broker } from './src/messaging/index.js';

const messages = await inspectDeadLetterQueue(broker, 10);
```

## Configuration

`rabbitmq.config.js` reads `NODE_ENV` and `RABBITMQ_URL` through
`src/config/env.js`.

| Environment | Prefetch | Publisher confirms | Retries |
| --- | ---: | --- | --- |
| `development` | 5 | No | 3: 5s, 15s, 60s |
| `test` | 1 | No | 1: 100ms |
| `staging` | 10 | Yes | Base settings (defined in messaging config; see note below) |
| `production` | 20 | Yes | 5: up to 15 minutes |

Set the RabbitMQ URL in the service environment. Staging and production fail
fast when it is missing.

```env
RABBITMQ_URL=amqp://user:password@rabbitmq-host:5672
NODE_ENV=development
```

### Current configuration notes

- `src/config/env.js` currently allows `development`, `test`, and
  `production`, but not `staging`. Although `rabbitmq.config.js` contains a
  staging configuration block, `NODE_ENV=staging` will be rejected by the
  environment validator until `staging` is added there.
- Importing the messaging module imports `src/config/env.js`, which requires a
  valid `DATABASE_URL` for the Order Service as well as any messaging-related
  environment values.
- The config object currently exposes the environment name as
  `config.envirnmont`. `index.js` logs `config.env`, so that particular startup
  log currently prints `undefined`; RabbitMQ settings themselves are still
  selected using `envirnmont`.

The RabbitMQ implementation requires `amqplib` to be installed in the Order
Service:

```bash
npm install amqplib
```

## Adding an event and consumer

1. Add an event definition in the appropriate file under `events/`, including
   its `routingKey`, `exchange`, and `buildPayload()` validation.
2. Add a durable consumer queue in `topology/queues.js`.
3. Add a binding in `topology/bindings.js` from the exchange and routing key to
   that queue.
4. Call `consumer.subscribe()` for the queue in the consuming service after
   `initializeTopology()`.

Adding a new consumer for an existing event normally changes only the queue,
binding, and consuming service. The publisher does not need to know how many
services receive its event.

## Reliability boundary

This folder makes broker delivery durable and retryable; it cannot make a
database update and a RabbitMQ publish atomic. For order creation or other
critical writes, use an outbox table written in the same database transaction
as the business data, then publish the outbox record from a worker.
