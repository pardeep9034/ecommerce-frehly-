import exchanges from '../topology/exchanges.js';
import queues from '../topology/queues.js';

/**
 * DeadLetterSetup.js
 *
 * Sets up the dead-letter exchange + queue that every other queue in
 * queues.js points to via `x-dead-letter-exchange`. This is where
 * messages end up when:
 *   - a consumer nacks without requeue, AND retries (if any) are exhausted
 *   - a message's TTL expires with no dead-letter override elsewhere
 *
 * This queue is NOT auto-consumed. Messages here represent failures that
 * need a human to look at, or a manual reprocessing script. Silently
 * auto-retrying forever, or silently dropping failures, are both worse
 * than making them visible here.
 */
async function setupDeadLetterInfrastructure(broker) {
  await broker.assertExchange(
    exchanges.DEAD_LETTER.name,
    exchanges.DEAD_LETTER.type,
    exchanges.DEAD_LETTER.options
  );

  await broker.assertQueue(queues.DEAD_LETTER_QUEUE.name, queues.DEAD_LETTER_QUEUE.options);

  await broker.bindQueue(queues.DEAD_LETTER_QUEUE.name, exchanges.DEAD_LETTER.name, '');

  console.log('[DeadLetterSetup] dead letter exchange + queue ready');
}

/**
 * Utility to inspect what's piled up in the DLQ — useful for an admin
 * endpoint or a periodic alert ("DLQ has 47 messages, someone should look").
 */
async function inspectDeadLetterQueue(broker, limit = 10) {
  const messages = [];
  const channel = await broker.connect();

  for (let i = 0; i < limit; i++) {
    const msg = await channel.get(queues.DEAD_LETTER_QUEUE.name, { noAck: true });
    if (!msg) break;
    messages.push({
      routingKey: msg.fields.routingKey,
      content: JSON.parse(msg.content.toString()),
      headers: msg.properties.headers,
    });
  }

  return messages;
}

export { setupDeadLetterInfrastructure, inspectDeadLetterQueue };
