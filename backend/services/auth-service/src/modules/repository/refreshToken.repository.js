import BaseRepository from "./BaseRepository.js";
import { Op } from "sequelize";

class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super('AuthRefreshToken');
  }

  async findByToken(tokenHash, options = {}) {
    if (!tokenHash) return null;
    return await this.findOne({ token_hash: tokenHash }, options);
  }

  async findByUserId(userId, options = {}) {
    if (!userId) return null;
    return await this.findOne({ user_id: userId }, options);
  }

  async findActiveByFamily(familyId, options = {}) {
    if (!familyId) return null;
    return await this.findOne({ family_id: familyId, is_revoked: false }, options);
  }

  async revokeByFamily(familyId, options = {}) {
    if (!familyId) return 0;
    return await this.update({ family_id: familyId }, { is_revoked: true }, options);
  }

  async revokeByUserId(userId, options = {}) {
    if (!userId) return 0;
    return await this.update({ user_id: userId }, { is_revoked: true }, options);
  }

  async revokeByToken(tokenHash, options = {}) {
    if (!tokenHash) return 0;
    return await this.update({ token_hash: tokenHash }, { is_revoked: true }, options);
  }

  async findValidToken(userId, deviceId, options = {}) {
    if (!userId || !deviceId) return null;
    const expiryTime = new Date();
    return await this.findOne({
      user_id: userId,
      device_id: deviceId,
      is_revoked: false,
      expires_at: {
        [Op.gt]: expiryTime
      }
    }, options);
  }
}

export default new RefreshTokenRepository();
