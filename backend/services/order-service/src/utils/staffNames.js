import { env } from "../config/env.js";
import logger from "./Logger.js";

// The name of a staff account, from auth-service (orders only store the id).
// Cached for a few minutes so opening orders doesn't call auth-service every time.
// If auth-service can't be reached this returns null and the caller shows the id instead.
const CACHE_MS = 5 * 60 * 1000;
const names = new Map(); // id -> { name, at }

export const getStaffName = async (id) => {
  const hit = names.get(id);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.name;

  try {
    const response = await fetch(`${env.AUTH_SERVICE_URL}/internal/users/names`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-key": env.INTERNAL_API_KEY ?? "" },
      body: JSON.stringify({ ids: [Number(id)] }),
      signal: AbortSignal.timeout(2000),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`status ${response.status}`);

    const name = body.data?.find((user) => Number(user.id) === Number(id))?.name ?? null;
    names.set(id, { name, at: Date.now() });
    return name;
  } catch (error) {
    logger.warn(`Staff name unavailable for user ${id}: ${error.message}`);
    return null;
  }
};

// For tests: forget the cached names.
export const resetStaffNames = () => names.clear();
