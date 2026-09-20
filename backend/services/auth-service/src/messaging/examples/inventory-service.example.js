/**
 * inventory-service.example.js
 *
 * Shows how Inventory Service (the consumer) uses the messaging module.
 * Notice: this file knows NOTHING about exchanges or Order Service's
 * internals. It just reacts to a fact it received.
 */
import { consumer, initializeTopology } from '../index.js';
import queues from '../topology/queues.js';
import logger from '../../utils/Logger.js';

// In a real service, this would be a Sequelize model / table.
// This in-memory set is just to demonstrate the idempotency check.
const processedEventIds = new Set();

async function reserveStock(orderData) {
  // Simulate a DB call
  logger.info(`Reserving stock for order ${orderData.orderId}`, { items: orderData.items });
}

async function main() {
  await initializeTopology(); // idempotent — safe even though Order Service already called it

  await consumer.subscribe(queues.INVENTORY_ORDER_QUEUE.name, async (event) => {
    // --- Idempotency check (at-least-once delivery means duplicates happen) ---
    if (processedEventIds.has(event.eventId)) {
      logger.info(`Duplicate event ${event.eventId} ignored.`);
      return;
    }

    await reserveStock(event.data);

    processedEventIds.add(event.eventId);
  });

  logger.info('Inventory Service: listening for order.created events...');
}

main().catch((err) => {
  logger.error('Inventory Service failed:', { message: err.message, stack: err.stack });
  process.exit(1);
});
