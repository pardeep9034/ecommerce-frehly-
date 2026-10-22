import queues from "./messaging/topology/queues.js";
import { consumer } from "./messaging/index.js";
import { handle } from "./intake.js";
import logger from "./utils/Logger.js";

export async function registerNotificationConsumers() {
  await consumer.subscribe(queues.NOTIFICATION_QUEUE.name, async (envelope) => {
    try {
      await handle(envelope);
    } catch (error) {
      // A bad event fails the same way every time: log and drop (ack) instead of retrying it into the DLQ.
      if (error.statusCode !== 400) throw error;
      logger.warn(`${queues.NOTIFICATION_QUEUE.name}: dropped event ${envelope.eventId ?? "?"}: ${error.message}`);
    }
  });
}
