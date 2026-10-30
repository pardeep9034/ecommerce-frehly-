import { sequelize, select } from "./db.js";
import { contacts, ADMIN_ROLES } from "./clients.js";

// The four "Email me when" switches. Defaults match Settings.jsx; a row holds only what the admin saved.
export const DEFAULTS = { warehousePauses: true, partnerApplies: true, failedPayments: true, dailySummary: false };

export async function preferencesOf(userIds) {
  const rows = userIds.length
    ? await select("SELECT user_id, value FROM notification_preferences WHERE user_id IN (:userIds)", { userIds })
    : [];
  const saved = new Map(rows.map((row) => [String(row.user_id), row.value]));
  return new Map(userIds.map((id) => [String(id), { ...DEFAULTS, ...saved.get(String(id)) }]));
}

// Merge patch: only the fields sent change, the rest keep their saved value or default.
export async function savePreferences(userId, patch) {
  await sequelize.query(
    `INSERT INTO notification_preferences (user_id, value) VALUES (:userId, CAST(:patch AS jsonb))
     ON CONFLICT (user_id) DO UPDATE SET value = notification_preferences.value || EXCLUDED.value, updated_at = now()`,
    { replacements: { userId, patch: JSON.stringify(patch) } }
  );
}

// Admins (ADMIN, SUPER_ADMIN, or the `roles` given) whose switch for `preference` is on. A switched-off admin gets
// no row at all.
export async function optedInAdmins(preference, roles = ADMIN_ROLES) {
  const admins = await contacts({ roles });
  const prefs = await preferencesOf(admins.map((admin) => admin.id));
  return admins.filter((admin) => prefs.get(String(admin.id))[preference]);
}
