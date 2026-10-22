import express from "express";
import Joi from "joi";
import { select, selectOne } from "./db.js";
import { handle } from "./intake.js";
import { contacts, ADMIN_ROLES } from "./clients.js";
import { DEFAULTS, preferencesOf, savePreferences } from "./preferences.js";
import { authenticateToken, requireInternalKey, requireRole } from "./middleware.js";
import ResponseUtil from "./utils/response.js";
import AppError from "./utils/AppError.js";

const valid = (schema, input) => {
  const { error, value } = schema.validate(input, { stripUnknown: false });
  if (error) throw new AppError(error.message, 400);
  return value;
};

/* ============ /internal: service to service, mounted before the IP limiter, never routed by the gateway ============ */

export const internalRoutes = express.Router();

// The same intake as the queue. 202 once the rows are in; sending happens in the background.
internalRoutes.post("/notifications/events", requireInternalKey, async (req, res) => {
  const created = await handle(req.body);
  return ResponseUtil.success(res, { created }, created ? "Accepted" : "Nothing new to send", 202);
});

/* ============ /notifications: admins, through the gateway ============ */

export const adminRoutes = express.Router();
adminRoutes.use(authenticateToken, requireRole(...ADMIN_ROLES));

async function myPreferences(userId) {
  const [prefs, [me]] = await Promise.all([preferencesOf([userId]), contacts({ ids: [Number(userId)] })]);
  return { ...prefs.get(String(userId)), hasEmail: Boolean(me?.email) };
}

adminRoutes.get("/preferences/me", async (req, res) => {
  return ResponseUtil.success(res, await myPreferences(req.user.user_id), "Preferences fetched");
});

const preferencesSchema = Joi.object(Object.fromEntries(Object.keys(DEFAULTS).map((key) => [key, Joi.boolean().strict()]))).min(1);

adminRoutes.patch("/preferences/me", async (req, res) => {
  await savePreferences(req.user.user_id, valid(preferencesSchema, req.body ?? {}));
  return ResponseUtil.success(res, await myPreferences(req.user.user_id), "Preferences saved");
});

// Counts for the last 24 h and how late the oldest queued row is.
adminRoutes.get("/stats", async (req, res) => {
  const counts = await select(
    "SELECT status, channel, count(*)::int AS count FROM notifications WHERE created_at > now() - interval '24 hours' GROUP BY status, channel ORDER BY status, channel"
  );
  const { oldest_queued_seconds } = await selectOne(
    "SELECT extract(epoch FROM now() - min(next_attempt_at))::int AS oldest_queued_seconds FROM notifications WHERE status = 'QUEUED'"
  );
  return ResponseUtil.success(res, { last24h: counts, oldestQueuedSeconds: oldest_queued_seconds }, "Notification stats fetched");
});

const logSchema = Joi.object({
  status: Joi.string().valid("QUEUED", "SENDING", "SENT", "FAILED", "SKIPPED"),
  channel: Joi.string().valid("SMS", "EMAIL"),
  template_key: Joi.string().max(64),
  user_id: Joi.number().integer().positive(),
  subject_id: Joi.string().max(64),
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const LOG_FILTERS = {
  status: "status = :status",
  channel: "channel = :channel",
  template_key: "template_key = :template_key",
  user_id: "recipient_user_id = :user_id",
  subject_id: "subject_id = :subject_id",
  from: "created_at >= :from",
  to: "created_at < :to",
};

// The support log. Masked addresses only: never vars, the raw address, the hash or the provider's error text.
adminRoutes.get("/", async (req, res) => {
  const query = valid(logSchema, req.query);
  const where = Object.keys(LOG_FILTERS).filter((key) => query[key] !== undefined).map((key) => LOG_FILTERS[key]);
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const replacements = { ...query, offset: (query.page - 1) * query.limit };
  const [items, { total }] = await Promise.all([
    select(
      `SELECT id, template_key, template_version, channel, category, status, reason, recipient_user_id, destination_masked,
              subject_id, attempts, provider, sent_at, created_by, created_at, updated_at
       FROM notifications ${whereSql} ORDER BY created_at DESC, id DESC LIMIT :limit OFFSET :offset`,
      replacements
    ),
    selectOne(`SELECT count(*)::int AS total FROM notifications ${whereSql}`, replacements),
  ]);
  return ResponseUtil.success(res, { items, total, page: query.page, limit: query.limit }, "Notifications fetched");
});
