import { env } from "../config/env.js";
import logger from "./Logger.js";

// The admin's saved order rules (Settings → Order rules), from config-service.
// Only paymentWindow is used here so far. If config-service can't be reached, the default stays in force.
const DEFAULTS = { paymentWindow: 15 };
const CACHE_MS = 60 * 1000; // a saved change reaches new orders within a minute

let cached = { at: 0, rules: DEFAULTS };

export const getOrderRules = async () => {
  if (Date.now() - cached.at < CACHE_MS) return cached.rules;

  let rules = cached.rules;
  try {
    const response = await fetch(`${env.CONFIG_SERVICE_URL}/config/internal/orderRules`, {
      headers: { "x-internal-key": env.INTERNAL_API_KEY ?? "" },
      signal: AbortSignal.timeout(2000),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`status ${response.status}`);
    rules = { ...DEFAULTS, ...body.data };
  } catch (error) {
    logger.warn(`Order rules unavailable, using ${rules.paymentWindow} min payment window: ${error.message}`);
  }

  cached = { at: Date.now(), rules };
  return rules;
};

// For tests: forget the cached copy.
export const resetOrderRules = () => { cached = { at: 0, rules: DEFAULTS }; };
