/**
 * Publisher.js
 *
 * The ONLY class your services should import to publish events.
 * Services never touch RabbitMQBroker or amqplib directly — they call
 * publisher.publish(eventDefinition, data), and everything about
 * exchanges, routing keys, and envelopes is handled here.
 *
 * Example usage from Order Service:
 *
 *   import OrderEvents from '../messaging/events/order.events.js';
 *   import { publisher } from '../messaging/index.js';
 *
 *   await publisher.publish(OrderEvents.ORDER_CREATED, {
 *     id: order.id, items: order.items, totalAmount: order.total, customerId: order.customerId
 *   });
 */
export default class Publisher {
  /**
   * @param {IMessageBroker} broker - any class implementing IMessageBroker
   */
  constructor(broker) {
    this.broker = broker;
  }

  /**
   * @param {object} eventDefinition - one entry from events/*.events.js,
   *   e.g. OrderEvents.ORDER_CREATED. Must have { exchange, routingKey, buildPayload }.
   * @param {object} rawData - the plain data to build the event payload from
   * @param {object} [options] - passed through to the broker's publish (e.g. headers)
   */
  async publish(eventDefinition, rawData, options = {}) {
    if (!eventDefinition?.buildPayload) {
      throw new Error('Publisher.publish() requires a valid event definition with buildPayload()');
    }

    const payload = eventDefinition.buildPayload(rawData);
    const content = Buffer.from(JSON.stringify(payload));

    await this.broker.publish(eventDefinition.exchange, eventDefinition.routingKey, content, {
      persistent: true,
      contentType: 'application/json',
      ...options,
    });

    console.log(
      `[Publisher] published "${eventDefinition.routingKey}" -> exchange "${eventDefinition.exchange}" (eventId: ${payload.eventId})`
    );

    return payload;
  }
}
