import userRepository from "../repository/user.repository.js";
import RefreshTokenRepository from "../repository/refreshToken.repository.js";
import UserSessionRepository from "../repository/userSession.repository.js";
import AuditRepository from "../repository/audit.repository.js";
import initializeModels from "../../models/index.js";
import AppError from "../../utils/AppError.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const STATUSES = { active: true, blocked: false };

const fullName = (user) => [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || null;
const addressLine = (address) => [address.address_line_1, address.address_line_2, address.city].filter(Boolean).join(", ");

class AdminUserService {
  // Customers for the admin Customers page: search + status + "joined in last N days" + pagination.
  // Order count / spend live in order-service (GET /orders/admin/customer-stats), not here.
  async listCustomers(query = {}) {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);

    let isActive;
    if (query.status) {
      if (!(query.status in STATUSES)) throw new AppError("status must be active or blocked", 400);
      isActive = STATUSES[query.status];
    }

    let joinedSince;
    if (query.joined_days) {
      const days = Number(query.joined_days);
      if (!Number.isInteger(days) || days < 1 || days > 365) throw new AppError("joined_days must be a number between 1 and 365", 400);
      joinedSince = new Date(Date.now() - days * DAY_MS);
    }

    // One exact customer, e.g. "View customer" from an order.
    let customerId;
    if (query.id) {
      customerId = Number(query.id);
      if (!Number.isInteger(customerId) || customerId <= 0) throw new AppError("id must be a positive number", 400);
    }

    const search = String(query.search ?? "").trim() || undefined;

    const [{ count, rows }, counts] = await Promise.all([
      userRepository.findCustomers({ id: customerId, search, isActive, joinedSince, limit, offset: (page - 1) * limit }),
      userRepository.getCustomerCounts(new Date(Date.now() - 7 * DAY_MS))
    ]);

    const totalPages = Math.ceil(count / limit);
    return {
      users: rows.map((user) => ({
        id: Number(user.id),
        name: fullName(user),
        phone: user.phone,
        email: user.email,
        is_active: user.is_active,
        joined: user.created_at,
        last_login_at: user.last_login_at,
        addresses: (user.addresses || []).map(addressLine)
      })),
      counts,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  // Block (is_active = false) or unblock a customer. Blocking also signs them out everywhere:
  // refresh tokens and sessions are revoked, and login / token refresh refuse inactive users.
  // An access token already issued still works in the other services until it expires (15 min),
  // because they verify the JWT locally.
  async setCustomerStatus(id, isActive, adminId) {
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) throw new AppError("Invalid customer id", 400);
    if (typeof isActive !== "boolean") throw new AppError("is_active must be true or false", 400);

    // Customers only: an admin can't block another admin (or themselves) from here.
    const user = await userRepository.findOne({ id: userId, role: "CUSTOMER", deleted_at: null });
    if (!user) throw new AppError("Customer not found", 404);
    if (user.is_active === isActive) return { id: userId, is_active: isActive };

    const db = await initializeModels();
    await db.sequelize.transaction(async (transaction) => {
      await userRepository.updateById(userId, { is_active: isActive }, { transaction });
      if (!isActive) {
        await RefreshTokenRepository.update(
          { user_id: userId, is_revoked: false },
          { is_revoked: true, revoked_at: new Date(), revoke_reason: "ADMIN_BLOCK" },
          { transaction }
        );
        await UserSessionRepository.update(
          { user_id: userId, status: "ACTIVE" },
          { status: "REVOKED", revoked_at: new Date() },
          { transaction }
        );
      }
      await AuditRepository.logEvent({
        user_id: userId,
        event_type: isActive ? "ACCOUNT_UNLOCKED" : "ACCOUNT_LOCKED",
        status: "SUCCESS",
        details: { reason: isActive ? "ADMIN_UNBLOCK" : "ADMIN_BLOCK", by_admin_id: Number(adminId) }
      }, { transaction });
    });

    return { id: userId, is_active: isActive };
  }
}

export default new AdminUserService();
