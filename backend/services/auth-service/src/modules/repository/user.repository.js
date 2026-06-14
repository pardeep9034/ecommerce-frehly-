import BaseRepository from "./BaseRepository.js";
import { Op } from "sequelize";

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
}

export default new UserRepository();
