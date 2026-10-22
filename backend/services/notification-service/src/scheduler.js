import { sequelize, selectOne } from "./db.js";
import { todayStats } from "./clients.js";
import { optedInAdmins } from "./preferences.js";
import { insertRows } from "./intake.js";
import logger from "./utils/Logger.js";

const TICK_MS = 60_000;

const prettyDate = (isoDate) =>
  new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// The daily summary. Runs on any tick from 22:00 to 23:59 IST, so a restart at 22:01 still sends.
// The unique key per admin and date is the lock: two replicas ticking together insert one row each.
// A service down for the whole window skips that day; nothing catches up the next morning.
export async function runDigest({ hour, date }) {
  if (hour !== 22 && hour !== 23) return 0;
  const sent = await selectOne(
    "SELECT 1 AS hit FROM notifications WHERE template_key = 'digest.daily_sales' AND subject_id = :date LIMIT 1",
    { date }
  );
  if (sent) return 0;
  const admins = await optedInAdmins("dailySummary");
  if (!admins.length) return 0;

  const stats = await todayStats();
  const { orders, cancelled, revenue } = stats.today;
  const vars = {
    date: prettyDate(date),
    orders,
    cancelled,
    cancelRate: orders ? `${Math.round((cancelled / orders) * 1000) / 10}%` : "0%",
    revenue: Math.round(Number(revenue)).toLocaleString("en-IN"),
    avgDelivery: stats.avgDeliveryMinutes == null ? "no deliveries yet" : `${Math.round(stats.avgDeliveryMinutes)} min`,
  };
  return insertRows(
    admins.map((admin) => ({
      key: `digest.daily_sales:${date}:u${admin.id}:EMAIL`,
      template: "digest.daily_sales",
      recipient: admin,
      vars,
      subjectId: date,
    }))
  );
}

async function housekeeping() {
  await sequelize.query("DELETE FROM notification_alert_hits WHERE occurred_at < now() - interval '1 day'");
  // A FAILED row keeps its address 7 days for Retry, then only the masked copy and the hash stay.
  await sequelize.query(
    "UPDATE notifications SET destination = NULL WHERE status = 'FAILED' AND destination IS NOT NULL AND updated_at < now() - interval '7 days'"
  );
  const { minutes } = await selectOne(
    "SELECT floor(extract(epoch FROM now() - min(next_attempt_at)) / 60)::int AS minutes FROM notifications WHERE status = 'QUEUED'"
  );
  if (minutes > 5) logger.warn(`notification.backlog oldest queued row is ${minutes} min overdue`);
}

async function tick() {
  try {
    const now = await selectOne(
      `SELECT extract(hour FROM now() AT TIME ZONE 'Asia/Kolkata')::int AS hour,
              to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS date`
    );
    await runDigest(now);
    await housekeeping();
  } catch (error) {
    logger.warn(`scheduler tick failed: ${error.message}`);
  }
}

let timer = null;
export function startScheduler() {
  tick();
  timer = setInterval(tick, TICK_MS).unref();
}
export const stopScheduler = () => clearInterval(timer);
