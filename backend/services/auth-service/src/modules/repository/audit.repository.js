import BaseRepository from "./BaseRepository.js";

class AuditRepository extends BaseRepository {
  constructor() {
    super('AuditLog');
  }

  async logEvent(data, options = {}) {
    return await this.create(data, options);
  }

  async findByUserId(userId, options = {}) {
    return await this.findOne({ user_id: userId }, {
      order: [['createdAt', 'DESC']],
      ...options
    });
  }

  async findRecentByIp(ipAddress, options = {}) {
    if (!ipAddress) return [];
    return await this.findOne({ ip_address: ipAddress }, {
      order: [['createdAt', 'DESC']],
      ...options
    });
  }
}

export default new AuditRepository();
