import BaseRepository from "./BaseRepository.js";
import { Op, Sequelize } from "sequelize";

class UserRepository extends BaseRepository {
  constructor() {
    super('AuthUser');
  }

  async findByPhone(phone, options = {}) {
    if (!phone) return null;
    return await this.findOne({ phone }, options);
  }

  async findByEmail(email, options = {}) {
    if (!email) return null;
    return await this.findOne({ email }, options);
  }

  async findByPhoneOrEmail(identifier, options = {}) {
    if (!identifier) return null;
    const Model = await this.getModel();
    return await Model.findOne({
      where: {
        [Op.or]: [
          { phone: identifier },
          { email: identifier }
        ]
      },
      ...options
    });
  }

  async markEmailVerified(userId, options = {}) {
    return await this.updateById(userId, { email_verified: true }, options);
  }

  async markPhoneVerified(userId, options = {}) {
    return await this.updateById(userId, { phone_verified: true }, options);
  }

  async incrementLoginAttempts(userId, options = {}) {
    const db = await this.getModel();
    return await db.increment('failed_login_attempts', {
      where: { id: userId },
      ...options
    });
  }

  async resetLoginAttempts(userId, options = {}) {
    return await this.updateById(userId, { 
      failed_login_attempts: 0, 
      account_locked_until: null 
    }, options);
  }

  async lockAccount(userId, lockUntil, options = {}) {
    return await this.updateById(userId, { account_locked_until: lockUntil }, options);
  }

  // Admin customer list. Only safe columns are selected (never password_hash / tokens).
  // Addresses load in a second query (`separate`) so limit/offset stay on the users.
  async findCustomers({ id, search, isActive, joinedSince, limit, offset }) {
    const Model = await this.getModel();
    const where = { role: "CUSTOMER", deleted_at: null };
    if (id) where.id = id;
    if (typeof isActive === "boolean") where.is_active = isActive;
    if (joinedSince) where.created_at = { [Op.gte]: joinedSince };
    if (search) {
      const pattern = `%${search}%`;
      where[Op.or] = [
        Sequelize.where(Sequelize.fn("concat_ws", " ", Sequelize.col("first_name"), Sequelize.col("last_name")), { [Op.iLike]: pattern }),
        { phone: { [Op.iLike]: pattern } },
        { email: { [Op.iLike]: pattern } }
      ];
    }

    return await Model.findAndCountAll({
      where,
      attributes: ["id", "first_name", "last_name", "email", "phone", "role", "warehouse_id", "is_active", "created_at", "last_login_at"],
      include: [{
        association: "addresses",
        separate: true,
        required: false,
        where: { is_active: true },
        attributes: ["id", "user_id", "address_line_1", "address_line_2", "city"],
        order: [["is_default", "DESC"], ["id", "ASC"]]
      }],
      order: [["created_at", "DESC"], ["id", "DESC"]],
      limit,
      offset
    });
  }

  // Every live staff account, newest first. The staff service filters and pages them.
  async findAllStaff(roles, attributes) {
    const Model = await this.getModel();
    return await Model.findAll({ where: { role: roles, deleted_at: null }, attributes, order: [["created_at", "DESC"], ["id", "DESC"]] });
  }

  // Names only, for other services that show who did something. Removed accounts are included: history keeps their name.
  async findNamesByIds(ids, roles) {
    const Model = await this.getModel();
    return await Model.findAll({ where: { id: ids, role: roles }, attributes: ["id", "first_name", "last_name"] });
  }

  // Contact details for notification-service: live (active, not removed) accounts only, by id or by role.
  // ponytail: no limit, so roles ["CUSTOMER"] returns every customer. Page it if a bulk send ever needs that.
  async findContacts({ ids, roles }) {
    const Model = await this.getModel();
    const where = { is_active: true, deleted_at: null, ...(ids ? { id: ids } : { role: roles }) };
    return await Model.findAll({ where, attributes: ["id", "role", "first_name", "phone", "email", "warehouse_id"], order: [["id", "ASC"]] });
  }

  // Numbers for the Customers stat cards (all customers, not just the page).
  async getCustomerCounts(newSince) {
    const Model = await this.getModel();
    const base = { role: "CUSTOMER", deleted_at: null };
    const [total, newThisWeek, blocked] = await Promise.all([
      Model.count({ where: base }),
      Model.count({ where: { ...base, created_at: { [Op.gte]: newSince } } }),
      Model.count({ where: { ...base, is_active: false } })
    ]);
    return { total, newThisWeek, blocked };
  }
}

export default new UserRepository();
