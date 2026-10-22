import { env } from "./config/env.js";
import { sequelize } from "./db.js";
import templates, { render } from "./templates.js";
import providers from "./providers.js";
import logger from "./utils/Logger.js";

// Same tries as rabbitmq.config.js: 3 in dev (waits of 5 s, 15 s), 5 in production up to 15 min.
export const BACKOFF_MS = env.NODE_ENV === "production" ? [5000, 15000, 60000, 300000, 900000] : [5000, 15000, 60000];
const BATCH = 20;
const PARALLEL = 4;
const POLL_MS = 2000;
const PROVIDER_TIMEOUT_MS = 10_000;

// Due rows, plus rows whose sender died (a SENDING lock older than 2 min). SKIP LOCKED keeps replicas off each other's rows.
// Ages come from the database clock: the Docker VM's clock steps.
const CLAIM_SQL = `
  UPDATE notifications SET status = 'SENDING', locked_at = now(), attempts = attempts + 1, updated_at = now()
  WHERE id IN (
    SELECT id FROM notifications
    WHERE (status = 'QUEUED' AND next_attempt_at <= now())
       OR (status = 'SENDING' AND locked_at < now() - interval '2 minutes')
    ORDER BY priority, next_attempt_at
    LIMIT ${BATCH}
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *, extract(epoch FROM now() - created_at)::int AS age_seconds`;

const update = (sql, replacements) =>
  sequelize.query(`UPDATE notifications SET ${sql}, locked_at = NULL, updated_at = now() WHERE id = :id`, { replacements });

const withTimeout = (promise) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("provider timeout")), PROVIDER_TIMEOUT_MS).unref()),
  ]);

const logLine = (event, row, extra = "") =>
  `notification.${event} id=${row.id} template=${row.template_key} channel=${row.channel} to=${row.destination_masked} attempts=${row.attempts}${extra}`;

// Takes one claimed (SENDING) row to its next status. Never throws; exported for the pipeline check.
export async function processRow(row, channelProviders = providers) {
  const id = row.id;
  const template = templates[row.template_key];
  try {
    if (template && row.age_seconds > template.staleAfterMin * 60) {
      await update("status = 'SKIPPED', reason = 'STALE', destination = NULL", { id });
      return logger.info(logLine("skipped", row, " reason=STALE"));
    }

    let message;
    try {
      message = render(row.template_key, row.vars);
    } catch (error) {
      await update("status = 'FAILED', reason = 'TEMPLATE_ERROR', last_error = :error", { id, error: error.message.slice(0, 300) });
      return logger.warn(logLine("failed", row, ` reason=TEMPLATE_ERROR error="${error.message}"`));
    }

    const provider = channelProviders[row.channel];
    const started = Date.now();
    try {
      if (!provider) throw Object.assign(new Error(`no provider for ${row.channel}`), { transient: false });
      const result = await withTimeout(provider.send({ to: row.destination, masked: row.destination_masked, ...message }));
      // The raw address goes once the row is final; sensitive vars (a delivery code) go after sending.
      await update(
        `status = 'SENT', sent_at = now(), provider = :provider, provider_message_id = :messageId, template_version = :version,
         reason = NULL, last_error = NULL, destination = NULL, vars = CASE WHEN sensitive THEN CAST('{}' AS jsonb) ELSE vars END`,
        { id, provider: provider.name, messageId: result?.messageId ?? null, version: template.version }
      );
      logger.info(logLine("sent", row, ` ms=${Date.now() - started}`));
    } catch (error) {
      // Timeouts, network errors and 5xx/429 are transient; a provider marks a rejection with transient = false.
      const transient = error.transient !== false;
      const lastError = error.message.slice(0, 300);
      if (transient && row.attempts < BACKOFF_MS.length) {
        await update("status = 'QUEUED', next_attempt_at = now() + make_interval(secs => :delaySeconds), last_error = :lastError", {
          id, delaySeconds: BACKOFF_MS[row.attempts - 1] / 1000, lastError,
        });
        logger.warn(logLine("retry", row, ` error="${lastError}"`));
      } else {
        const reason = transient ? "RETRIES_EXHAUSTED" : "PROVIDER_REJECTED";
        await update("status = 'FAILED', reason = :reason, last_error = :lastError", { id, reason, lastError });
        logger.warn(logLine("failed", row, ` reason=${reason} error="${lastError}"`));
      }
    }
  } catch (error) {
    // The database itself failed; the 2-minute lock timeout hands the row to the next claim.
    logger.error(`dispatcher: row ${id} not updated: ${error.message}`);
  }
}

let started = false;
let running = false;
let again = false;
let timer = null;

async function tick() {
  running = true;
  try {
    do {
      again = false;
      const [rows] = await sequelize.query(CLAIM_SQL);
      for (let i = 0; i < rows.length; i += PARALLEL) {
        await Promise.all(rows.slice(i, i + PARALLEL).map((row) => processRow(row)));
      }
      if (rows.length === BATCH) again = true;
    } while (again && started);
  } catch (error) {
    logger.error(`dispatcher: claim failed: ${error.message}`);
  } finally {
    running = false;
    if (started) timer = setTimeout(tick, POLL_MS).unref();
  }
}

// Intake calls kick() after inserting rows, so a new message goes out at once instead of on the next 2 s poll.
export function kick() {
  if (!started) return;
  if (running) {
    again = true;
    return;
  }
  clearTimeout(timer);
  timer = setTimeout(tick, 0).unref();
}

export function startDispatcher() {
  started = true;
  tick();
}

export function stopDispatcher() {
  started = false;
  clearTimeout(timer);
}
