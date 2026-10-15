import AuditRepository from "../repository/audit.repository.js";
import AppError from "../../utils/AppError.js";

const HOUR_MS = 3_600_000;

// The Activity log page filters by these groups; the event types inside are the AuthAuditLog enum.
export const GROUPS = {
  inout: ["LOGIN_SUCCESS", "LOGOUT", "LOGOUT_ALL"],
  failed: ["LOGIN_FAILURE"],
  password: ["PASSWORD_CHANGE", "PASSWORD_RESET_REQUEST", "PASSWORD_RESET_SUCCESS"],
  lock: ["ACCOUNT_LOCKED", "ACCOUNT_UNLOCKED"],
};
// Time windows the page offers: last hour, day, week, month.
export const RANGE_HOURS = [1, 24, 168, 720];

const fullName = (user) => [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() || null;

class AuditLogService {
  async list(query = {}) {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);

    let types;
    if (query.group) {
      if (!(query.group in GROUPS)) throw new AppError(`group must be one of ${Object.keys(GROUPS).join(", ")}`, 400);
      types = GROUPS[query.group];
    }

    const hours = query.hours === undefined ? 24 : Number(query.hours);
    if (!RANGE_HOURS.includes(hours)) throw new AppError(`hours must be one of ${RANGE_HOURS.join(", ")}`, 400);

    const search = String(query.search ?? "").trim().slice(0, 100) || undefined;

    const [{ count, rows }, meta] = await Promise.all([
      AuditRepository.findPage({ types, since: new Date(Date.now() - hours * HOUR_MS), search, limit, offset: (page - 1) * limit }),
      AuditRepository.stats(),
    ]);

    const totalPages = Math.ceil(count / limit);
    return {
      events: rows.map((row) => ({
        id: Number(row.id),
        created_at: row.created_at,
        event_type: row.event_type,
        status: row.status,
        user_id: row.user_id === null ? null : Number(row.user_id),
        // Sign-in rows carry what was typed; block / unblock rows only the user id, so fall back to the account.
        phone: row.phone ?? row.user?.phone ?? null,
        email: row.email ?? row.user?.email ?? null,
        name: fullName(row.user),
        ip_address: row.ip_address,
        user_agent: row.user_agent,
        device_id: row.device_id,
        error_message: row.error_message,
        details: row.details,
      })),
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      meta,
    };
  }
}

export default new AuditLogService();
