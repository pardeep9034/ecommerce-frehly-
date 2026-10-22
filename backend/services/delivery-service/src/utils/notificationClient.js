import crypto from "node:crypto";
import { env } from "../config/env.js";
import logger from "./Logger.js";

const TIMEOUT_MS = 3000;

// Hands an event to notification-service's /internal/notifications/events. Best effort: it never throws, so callers
// run it with `void` after their commit. A failure is a WARN with the event id; the payload never goes to the log.
export const publishEvent = async (eventType, data) => {
  const eventId = crypto.randomUUID();
  try {
    const res = await fetch(`${env.NOTIFICATION_SERVICE_URL}/internal/notifications/events`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-key": env.INTERNAL_API_KEY },
      body: JSON.stringify({ eventId, eventType, version: 1, occurredAt: new Date().toISOString(), data }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) logger.warn(`notification-service answered ${res.status} for ${eventType} ${eventId}`);
  } catch (error) {
    logger.warn(`notification-service call failed for ${eventType} ${eventId}: ${error.name}`);
  }
};
