import { col, fn, Op } from "sequelize";
import BaseRepository from "./BaseRepository.js";

class AuditRepository extends BaseRepository {
  constructor() {
    super('AuthAuditLog');
  }

  async logEvent(data, options = {}) {
    return await this.create(data, options);
  }

  // One page for the Activity log, newest first (id breaks ties). `search` matches the phone or email typed at sign-in,
  // the account's own phone (block / unblock rows carry only a user id), the IP, or an exact user id.
  async findPage({ types, since, search, limit, offset }) {
    const where = { created_at: { [Op.gte]: since } };
    if (types) where.event_type = { [Op.in]: types };
    if (search) {
      // % _ and \ in the text are literal characters, not LIKE wildcards.
      const like = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
      where[Op.or] = [
        { phone: { [Op.iLike]: like } },
        { email: { [Op.iLike]: like } },
        { ip_address: { [Op.iLike]: like } },
        { "$user.phone$": { [Op.iLike]: like } },
        ...(/^\d{1,15}$/.test(search) ? [{ user_id: search }] : []),
      ];
    }
    return await this.findAndCountAll(where, {
      include: [{ association: "user", attributes: ["id", "phone", "email", "first_name", "last_name"], required: false }],
      order: [["created_at", "DESC"], ["id", "DESC"]],
      limit,
      offset,
    });
  }

  // Whole-table counts for the Sources tab: how many rows exist and how many carry each optional field.
  async stats() {
    const Model = await this.getModel();
    const row = await Model.findOne({
      attributes: [
        [fn("COUNT", col("id")), "total"],
        [fn("COUNT", col("ip_address")), "with_ip"],
        [fn("COUNT", col("user_agent")), "with_user_agent"],
        [fn("COUNT", col("device_id")), "with_device"],
        [fn("MIN", col("created_at")), "oldest_at"],
      ],
      raw: true,
    });
    return {
      total: Number(row.total),
      with_ip: Number(row.with_ip),
      with_user_agent: Number(row.with_user_agent),
      with_device: Number(row.with_device),
      oldest_at: row.oldest_at,
    };
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
