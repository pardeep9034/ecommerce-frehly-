import BaseRepository from "./BaseRepository.js";
import { Op } from "sequelize";

class OTPRepository extends BaseRepository {
  constructor() {
    super('OTP');
  }

  async findLatestOtp(userId, type, options = {}) {
    if (!userId || !type) return null;
    return await this.findOne({
      user_id: userId,
      type,
      used_at: null,
      expires_at: {
        [Op.gt]: new Date()
      }
    }, {
      order: [['createdAt', 'DESC']],
      ...options
    });
  }

  async incrementAttempts(id, options = {}) {
    if (!id) return null;
    const Model = await this.getModel();
    return await Model.increment('attempt_count', {
      where: { id },
      ...options
    });
  }

  async markUsed(id, options = {}) {
    if (!id) return null;
    return await this.updateById(id, { used_at: new Date() }, options);
  }

  async deleteExpiredOtps(options = {}) {
    const Model = await this.getModel();
    return await Model.destroy({
      where: {
        expires_at: {
          [Op.lt]: new Date()
        }
      },
      ...options
    });
  }

  async revokePendingOtps(userId, type, options = {}) {
    if (!userId || !type) return null;
    return await this.update(
      { user_id: userId, type, used_at: null },
      { used_at: new Date() }, // Or mark as invalidated
      options
    );
  }
}

export default new OTPRepository();