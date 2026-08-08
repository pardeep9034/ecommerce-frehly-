/**
 * order-service.example.js
 *
 * Shows how Order Service (the publisher) uses the messaging module.
 * Notice: this file knows NOTHING about queues, bindings, or who's
 * listening. It just publishes a fact.
 */
import { publisher, initializeTopology } from '../index.js';
import OrderEvents from '../events/order.events.js';

async function main() {
  await initializeTopology(); // declares exchanges/queues/bindings (idempotent)

  // Simulate creating an order (in real code, this happens inside your
  // Sequelize transaction / outbox pattern, right after Order.create)
  const order = {
    id: 1001,
    items: [{ sku: 'LAPTOP-15', qty: 1 }],
    totalAmount: 899.0,
    customerId: 'cust_501',
  };

  await publisher.publish(OrderEvents.ORDER_CREATED, order);

  console.log('Order Service: order.created event published.');
}

main().catch((err) => {
  console.error('Order Service failed:', err);
  process.exit(1);
});
