import { env } from "../config/env.js";
import AppError from "./AppError.js";
import logger from "./Logger.js";

const TIMEOUT_MS = 5000;

// Finds or creates the auth user for a phone (role DELIVERY_PARTNER) through auth-service's /internal/partners.
// Returns { userId, registered }; registered means the person already has a finished account and can sign in.
// 409 passes auth's message on (the number belongs to a customer or staff account). Everything else that goes wrong
// is a 502 with a fixed message: the real cause goes to the log, never to the client.
export const findOrCreatePartnerUser = async ({ phone, name }) => {
  let res;
  try {
    res = await fetch(`${env.AUTH_SERVICE_URL}/internal/partners`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-key": env.INTERNAL_API_KEY },
      body: JSON.stringify({ phone, name }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    logger.error(`auth-service call failed: ${error.name}: ${error.message}`);
    throw new AppError("Account service unavailable. Try again.", 502);
  }

  const body = await res.json().catch(() => ({}));
  if (res.status === 409) throw new AppError(body.message || "This number can't be used for a delivery partner.", 409);
  if (!res.ok || !body.data?.user_id) {
    logger.error(`auth-service answered ${res.status} for /internal/partners`);
    throw new AppError("Account service unavailable. Try again.", 502);
  }
  return { userId: body.data.user_id, registered: body.data.registered === true };
};
