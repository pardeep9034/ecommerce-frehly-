import jwt from "jsonwebtoken";
import { env } from "./config/env.js";
import AppError from "./utils/AppError.js";
import logger from "./utils/Logger.js";

export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

// A failed call is a 502 with a fixed message (the cause goes to the log), like delivery-service's authClient.
async function call(service, url, init) {
  let res;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(5000) });
  } catch (error) {
    logger.warn(`${service} call failed: ${error.name}`);
    throw new AppError(`${service} is unavailable`, 502);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    logger.warn(`${service} answered ${res.status}: ${body.message ?? ""}`);
    throw new AppError(`${service} is unavailable`, 502);
  }
  return body.data;
}

// ponytail: per-process 60 s cache keyed by the request; a changed phone or email shows up within a minute.
const cache = new Map();
const CACHE_MS = 60_000;

// `{ ids: [...] }` or `{ roles: [...] }` → [{ id, role, first_name, phone, email, warehouse_id }] for active users.
export async function contacts(query) {
  const key = JSON.stringify(query);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;

  const data = await call("auth-service", `${env.AUTH_SERVICE_URL}/internal/users/contacts`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-internal-key": env.INTERNAL_API_KEY },
    body: JSON.stringify(query),
  });
  if (cache.size >= 500) cache.clear();
  cache.set(key, { at: Date.now(), data });
  return data;
}

// Today's numbers for the daily summary, as a SYSTEM caller (the same short-lived token order-service makes for itself).
export async function todayStats() {
  const token = jwt.sign({ user_id: "system", role: "SYSTEM" }, env.JWT_SECRET, { expiresIn: "5m" });
  return call("order-service", `${env.ORDER_SERVICE_URL}/orders/admin/stats?days=1&tz=Asia/Kolkata`, {
    headers: { authorization: `Bearer ${token}` },
  });
}
