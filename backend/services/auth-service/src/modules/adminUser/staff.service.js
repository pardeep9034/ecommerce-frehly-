import crypto from "node:crypto";
import Joi from "joi";
import userRepository from "../repository/user.repository.js";
import RefreshTokenRepository from "../repository/refreshToken.repository.js";
import UserSessionRepository from "../repository/userSession.repository.js";
import AuditRepository from "../repository/audit.repository.js";
import initializeModels from "../../models/index.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/Logger.js";
import { send } from "../../utils/sms/index.js";
import { env } from "../../config/env.js";
import { STAFF_ROLES } from "../../constants/roles.js";

// Admin and ops-staff accounts for the admin Staff pages (super admins only, bar the own-store list; see adminUser.routes.js).
// Passwords an admin types are never echoed back, and a generated one goes out only by SMS.

const ROLE_LABELS = { SUPER_ADMIN: "super admin", ADMIN: "store admin", OPS_STAFF: "ops staff" };

const phone = Joi.string().trim().replace(/[\s-]/g, "").pattern(/^(\+?91)?[0-9]{10}$/).custom((value) => value.slice(-10))
  .messages({ "string.pattern.base": "Enter a 10-digit mobile number" });
const name = Joi.string().trim().min(2).max(50);
// No top-level-domain list: Joi's built-in one rejects newer and company domains.
const email = Joi.string().trim().email({ tlds: { allow: false } }).max(255);
const role = Joi.string().valid(...STAFF_ROLES);
// No foreign key: warehouses belong to inventory-service, so the id is taken as given.
const warehouseId = Joi.number().integer().positive().allow(null);
const password = Joi.string().min(8).max(100).pattern(/[A-Za-z]/).pattern(/\d/)
  .messages({ "string.pattern.base": "Password needs a letter and a number" });
// "set": the admin types the password. "link": we generate one and SMS it (a real link needs a client page).
const method = Joi.string().valid("set", "link").default("set");
const passwordWhenSet = Joi.when("password_method", { is: "set", then: password.required(), otherwise: Joi.forbidden() });
// No shift column yet (the store console will own it): accepted and dropped.
const shift = Joi.any().strip();

const createSchema = Joi.object({
  first_name: name.required(), last_name: name.required(), phone: phone.required(), email, role: role.required(),
  warehouse_id: warehouseId, shift, password_method: method, password: passwordWhenSet,
  must_change_password: Joi.boolean().default(true),
});
const updateSchema = Joi.object({ first_name: name, last_name: name, phone, email, role, warehouse_id: warehouseId, shift });
const resetSchema = Joi.object({ password_method: method, password: passwordWhenSet, must_change_password: Joi.boolean().default(true) });

const parse = (schema, body) => {
  const { error, value } = schema.validate(body ?? {}, { abortEarly: true, stripUnknown: true });
  if (error) throw new AppError(error.details[0].message, 400);
  return value;
};

const SAFE_COLUMNS = ["id", "first_name", "last_name", "email", "phone", "role", "warehouse_id", "is_active", "account_locked_until",
  "failed_login_attempts", "last_login_at", "created_at", "must_change_password"];

const fullName = (user) => [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || null;

// Explicit fields only: the model instance also carries password_hash and the refresh token.
const toStaff = (user) => ({
  id: Number(user.id),
  first_name: user.first_name,
  last_name: user.last_name,
  name: fullName(user),
  phone: user.phone,
  email: user.email,
  role: user.role,
  warehouse_id: user.warehouse_id === null ? null : Number(user.warehouse_id),
  is_active: user.is_active,
  account_locked_until: user.account_locked_until,
  failed_login_attempts: user.failed_login_attempts,
  last_login_at: user.last_login_at,
  joined: user.created_at,
  must_change_password: user.must_change_password,
  invite_pending: user.must_change_password && !user.last_login_at,
});

// Same order and rules as the client's staffStatus (client/src/lib/staffRole.js).
const STATUSES = ["DISABLED", "LOCKED", "INVITE_SENT", "MUST_CHANGE_PASSWORD", "ACTIVE"];
const statusOf = (user, now) => {
  if (!user.is_active) return "DISABLED";
  if (user.account_locked_until && new Date(user.account_locked_until) > now) return "LOCKED";
  if (user.invite_pending) return "INVITE_SENT";
  if (user.must_change_password) return "MUST_CHANGE_PASSWORD";
  return "ACTIVE";
};

const listSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  role,
  status: Joi.string().valid(...STATUSES),
  warehouse_id: Joi.alternatives(Joi.string().valid("none"), Joi.number().integer().positive()),
  search: Joi.string().trim().max(100).allow(""),
});

// Over every staff account, not the filtered page: the role tabs and stat tiles show totals.
const summarize = (users) => {
  const count = (test) => users.filter(test).length;
  return {
    total: users.length,
    super_admin: count((u) => u.role === "SUPER_ADMIN"),
    admin: count((u) => u.role === "ADMIN"),
    admin_unassigned: count((u) => u.role === "ADMIN" && u.warehouse_id === null),
    ops_staff: count((u) => u.role === "OPS_STAFF"),
    locked: count((u) => u.status === "LOCKED"),
    first_login_pending: count((u) => ["INVITE_SENT", "MUST_CHANGE_PASSWORD"].includes(u.status)),
    attention: count((u) => ["LOCKED", "INVITE_SENT", "MUST_CHANGE_PASSWORD"].includes(u.status)),
  };
};

// Customers, partners and soft-deleted rows are "not found" here.
const findStaff = async (id, options = {}) => {
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) throw new AppError("Invalid user id", 400);
  const user = await userRepository.findOne({ id: userId, role: STAFF_ROLES, deleted_at: null }, options);
  if (!user) throw new AppError("User not found", 404);
  return user;
};

// 12 characters with an upper, a lower, a digit and a symbol (no look-alikes), shuffled.
const tempPassword = () => {
  const pick = (chars) => chars[crypto.randomInt(chars.length)];
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const chars = [pick("ABCDEFGHJKLMNPQRSTUVWXYZ"), pick("abcdefghijkmnpqrstuvwxyz"), pick("23456789"), pick("#@$!"), ...Array.from({ length: 8 }, () => pick(letters))];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
};

// Best effort: false means the SMS did not go out. The password is never logged here (the console provider logs the
// whole text in development; config refuses that provider in production).
const sendLogin = async (user, temporary) => {
  const where = env.ADMIN_APP_URL ? ` Sign in at ${env.ADMIN_APP_URL}.` : "";
  try {
    await send({
      to: user.phone,
      kind: "TRANSACTION",
      text: `Freshly: ${user.first_name}, your ${ROLE_LABELS[user.role]} login is ready. Login ID ${user.phone}, temporary password ${temporary}.${where} Change it after you sign in.`,
    });
    return true;
  } catch (error) {
    logger.warn(`Staff login SMS failed for user ${user.id}: ${error.message}`);
    return false;
  }
};

// A role change or a new password must end the sessions already open (access tokens live out their 15 minutes).
const signOut = async (userId, reason, transaction) => {
  await RefreshTokenRepository.revokeByUserId(userId, reason, { transaction });
  await UserSessionRepository.revokeSessionByUserId(userId, { transaction });
};

const audit = (userId, eventType, details, transaction) =>
  AuditRepository.logEvent({ user_id: userId, event_type: eventType, status: "SUCCESS", details }, { transaction });

// A warehouse's contact person and phone are its store manager's (null when it has none). Warehouses live in
// inventory-service, so this runs after the save and never throws: a failed call is logged and the staff change stands.
const setWarehouseContact = async (warehouseId, manager) => {
  if (!env.INTERNAL_API_KEY) return;
  try {
    const response = await fetch(`${env.API_GATEWAY_URL}/warehouses/${warehouseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-internal-key": env.INTERNAL_API_KEY },
      body: JSON.stringify({ contact_person: manager ? fullName(manager) : null, contact_phone: manager?.phone ?? null }),
    });
    if (!response.ok) logger.warn(`Warehouse ${warehouseId} contact not updated: HTTP ${response.status}`);
  } catch (error) {
    logger.warn(`Warehouse ${warehouseId} contact not updated: ${error.message}`);
  }
};

// After a store manager is added, moved, renamed or made ops staff: the warehouse they were at and the one they are
// at now each get their current manager (someone else left there, or nobody).
const syncManagerContacts = async (before, after) => {
  const atWarehouse = (user) => user?.role === "ADMIN" && user.warehouse_id != null;
  const ids = new Set([before, after].filter(atWarehouse).map((user) => Number(user.warehouse_id)));
  for (const warehouseId of ids) {
    const manager = atWarehouse(after) && Number(after.warehouse_id) === warehouseId
      ? after
      : await userRepository.findOne({ role: "ADMIN", warehouse_id: warehouseId, is_active: true, deleted_at: null });
    await setWarehouseContact(warehouseId, manager);
  }
};
const CONTACT_FIELDS = ["role", "warehouse_id", "first_name", "last_name", "phone"];

class StaffService {
  // The Staff page list: role / status / warehouse ("none" = unassigned) / search, paged, plus summary counts.
  // ponytail: loads every staff account and filters in memory (staff is tens of rows); move the filters to SQL if it reaches thousands.
  // The super admin lists every store. A store manager or store staff (the warehouse Team tab, read only) lists only
  // their own store's team, summary counts included; with no store assigned they get a 403.
  async listStaff(query, caller) {
    // The Staff page sends an unset filter as an empty string (`role=`).
    const given = Object.fromEntries(Object.entries(query ?? {}).filter(([, value]) => value !== ""));
    const own = caller?.role === "SUPER_ADMIN" ? null : Number(caller?.warehouse_id);
    if (own !== null && !(Number.isInteger(own) && own > 0)) throw new AppError("No store is assigned to this account", 403);
    if (own !== null) given.warehouse_id = own;
    const { page, limit, role: roleFilter, status, warehouse_id: warehouseId, search } = parse(listSchema, given);
    const now = new Date();
    const staffRows = (await userRepository.findAllStaff(STAFF_ROLES, SAFE_COLUMNS)).map((user) => {
      const staff = toStaff(user);
      return { ...staff, status: statusOf(staff, now) };
    });
    const all = own === null ? staffRows : staffRows.filter((u) => u.warehouse_id === own);

    const term = search?.toLowerCase();
    const matches = all.filter((u) =>
      (!roleFilter || u.role === roleFilter) &&
      (!status || u.status === status) &&
      (warehouseId === undefined || (warehouseId === "none" ? u.warehouse_id === null : u.warehouse_id === warehouseId)) &&
      (!term || `${u.name ?? ""} ${u.phone ?? ""} ${u.email ?? ""}`.toLowerCase().includes(term))
    );

    const totalPages = Math.ceil(matches.length / limit);
    return {
      users: matches.slice((page - 1) * limit, page * limit),
      summary: summarize(all),
      pagination: { totalItems: matches.length, totalPages, currentPage: page, limit, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    };
  }

  // One account, for the Edit user form.
  // Not available yet: shift (no column) and warehouse_name (inventory-service; the client joins it).
  async getStaff(id) {
    return toStaff(await findStaff(id, { attributes: SAFE_COLUMNS }));
  }

  async createStaff(body, actorId) {
    const data = parse(createSchema, body);
    if (await userRepository.findByPhone(data.phone)) throw new AppError("This phone number is already registered", 409);
    if (data.email && await userRepository.findByEmail(data.email)) throw new AppError("This email is already registered", 409);

    const link = data.password_method === "link";
    const temporary = link ? tempPassword() : data.password;
    const db = await initializeModels();

    let user;
    try {
      user = await db.sequelize.transaction(async (transaction) => {
        // phone_verified + profile_complete make this a finished account: without them login treats it as a sign-up.
        const created = await userRepository.create({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          email: data.email ?? null,
          role: data.role,
          warehouse_id: data.role === "SUPER_ADMIN" ? null : data.warehouse_id ?? null,
          password_hash: temporary, // hashed by the model's beforeCreate hook
          phone_verified: true,
          profile_complete: true,
          must_change_password: link || data.must_change_password,
        }, { transaction });
        await audit(created.id, "PROFILE_UPDATED", { action: "STAFF_CREATED", role: data.role, by_admin_id: Number(actorId) }, transaction);
        return created;
      });
    } catch (error) {
      // Two admins adding the same number at once: the unique index decides.
      if (error.name === "SequelizeUniqueConstraintError") throw new AppError("This phone number or email is already registered", 409);
      throw error;
    }

    await syncManagerContacts(null, user);
    return { ...toStaff(user), invite_sent: link ? await sendLogin(user, temporary) : false };
  }

  async updateStaff(id, body, actorId) {
    const data = parse(updateSchema, body);
    const user = await findStaff(id);

    const nextRole = data.role ?? user.role;
    if (nextRole !== user.role && Number(user.id) === Number(actorId)) throw new AppError("You cannot change your own role", 400);
    if (data.phone && data.phone !== user.phone && await userRepository.findByPhone(data.phone)) throw new AppError("This phone number is already registered", 409);
    if (data.email && data.email !== user.email && await userRepository.findByEmail(data.email)) throw new AppError("This email is already registered", 409);
    if (nextRole === "SUPER_ADMIN") data.warehouse_id = null; // super admins work in every warehouse

    // Compare as text: a BIGINT comes back from Postgres as a string, so 7 !== "7" would log a change on every save.
    const changes = {};
    for (const [key, value] of Object.entries(data)) {
      if (String(value ?? "") !== String(user[key] ?? "")) changes[key] = value;
    }
    if (!Object.keys(changes).length) return toStaff(user);

    const from = user.role;
    const before = { role: user.role, warehouse_id: user.warehouse_id };
    const db = await initializeModels();
    try {
      await db.sequelize.transaction(async (transaction) => {
        await user.update(changes, { transaction });
        if (changes.role) {
          await signOut(user.id, "ROLE_CHANGE", transaction);
          await audit(user.id, "ROLE_CHANGE", { from, to: changes.role, changed: Object.keys(changes), by_admin_id: Number(actorId) }, transaction);
        } else {
          await audit(user.id, "PROFILE_UPDATED", { changed: Object.keys(changes), by_admin_id: Number(actorId) }, transaction);
        }
      });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") throw new AppError("This phone number or email is already registered", 409);
      throw error;
    }
    if (CONTACT_FIELDS.some((key) => key in changes)) await syncManagerContacts(before, user);
    return toStaff(user);
  }

  async resetPassword(id, body, actorId) {
    const data = parse(resetSchema, body);
    const user = await findStaff(id);

    const link = data.password_method === "link";
    const temporary = link ? tempPassword() : data.password;
    const db = await initializeModels();
    await db.sequelize.transaction(async (transaction) => {
      // A reset also lifts the 5-wrong-passwords lock, like the forgot-password flow does.
      await user.update({
        password_hash: temporary, // hashed by the model's beforeUpdate hook
        failed_login_attempts: 0,
        account_locked_until: null,
        must_change_password: link || data.must_change_password,
      }, { transaction });
      await signOut(user.id, "ADMIN_PASSWORD_RESET", transaction);
      await audit(user.id, "PASSWORD_RESET_SUCCESS", { reason: "ADMIN_RESET", by_admin_id: Number(actorId) }, transaction);
    });

    return { ...toStaff(user), invite_sent: link ? await sendLogin(user, temporary) : false };
  }

  // Only while the person still has the temporary password. The old one cannot be read back, so this makes a new one.
  async resendInvite(id, actorId) {
    const user = await findStaff(id);
    if (!user.must_change_password) {
      throw new AppError("This person already chose their own password. Use Reset password instead.", 409);
    }

    const temporary = tempPassword();
    const db = await initializeModels();
    await db.sequelize.transaction(async (transaction) => {
      await user.update({ password_hash: temporary, failed_login_attempts: 0, account_locked_until: null }, { transaction });
      await signOut(user.id, "ADMIN_RESEND_INVITE", transaction);
      await audit(user.id, "PASSWORD_RESET_REQUEST", { reason: "ADMIN_RESEND_INVITE", by_admin_id: Number(actorId) }, transaction);
    });

    // The whole point of this call is the SMS, so a failed send is an error the admin can retry.
    if (!(await sendLogin(user, temporary))) throw new AppError("Could not send the SMS. Try again in a moment.", 502);
    return { ...toStaff(user), invite_sent: true };
  }
}

export default new StaffService();
