import { Op } from "sequelize";
import BaseRepository from "./baseRepository.js";

class DeliveryPartnerRepository extends BaseRepository {
  constructor() {
    super("DeliveryPartner");
  }

  async createDeliveryPartner(data, options = {}) {
    return await this.create(data, options);
  }

  async getDeliveryPartnerById(id, options = {}) {
    return await this.findById(id, options);
  }

  async getDeliveryPartnerByUserId(userId, options = {}) {
    return await this.findOne({ user_id: userId }, options);
  }

  // The partner app's own row, with name and phone (hidden by the default scope). Only requireActivePartner calls this.
  async findByUserIdWithContact(userId) {
    const Model = (await this.getModel()).unscoped();
    return await Model.findOne({ where: { user_id: userId } });
  }

  async getDeliveryPartnerByVehicleNumber(vehicleNumber, options = {}) {
    return await this.findOne({ vehicle_number: vehicleNumber }, options);
  }

  // Waits for any other approval of the same plate to commit (A3). Released at commit or rollback. `plate` is normalized.
  // ponytail: the direct POST /delivery-partners does not take this lock; the unique index on vehicle_number is its backstop.
  async lockPlate(plate, options = {}) {
    const Model = await this.getModel();
    await Model.sequelize.query("SELECT pg_advisory_xact_lock(hashtext(:key))", { replacements: { key: `partner-plate:${plate}` }, ...options });
  }

  // Is this plate on a partner already, ignoring spaces, hyphens and case (E4)? Keep in step with normalizePlate().
  async plateExists(plate, options = {}) {
    const Model = await this.getModel();
    const [rows] = await Model.sequelize.query(
      "SELECT 1 FROM delivery_partners WHERE REGEXP_REPLACE(UPPER(vehicle_number), '[\\s-]', '', 'g') = :plate LIMIT 1",
      { replacements: { plate }, ...options }
    );
    return rows.length > 0;
  }

  async getAllDeliveryPartners(limit = 10, offset = 0) {
    return await this.findAndCountAll({}, {
      limit,
      offset,
      order: [["created_at", "DESC"]]
    });
  }

  // Staff list: the only reader of name/phone (hidden by the model's default scope).
  async findPartners({ search, zoneId, status, online, limit, offset }) {
    const Model = (await this.getModel()).unscoped();
    const where = {};
    if (zoneId !== undefined) where.zone_id = zoneId;
    if (status) where.status = status;
    if (online !== undefined) where.is_online = online;
    if (search) {
      const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
      where[Op.or] = ["name", "phone", "vehicle_number"].map((field) => ({ [field]: { [Op.iLike]: pattern } }));
    }

    return await Model.findAndCountAll({
      where,
      include: [{ association: "zone", attributes: ["id", "name"] }],
      order: [["created_at", "DESC"], ["id", "DESC"]],
      limit,
      offset
    });
  }

  // The staff partner page: name and phone are hidden by the default scope, so this reads unscoped (staff routes only).
  async findWithZone(id) {
    const Model = (await this.getModel()).unscoped();
    return await Model.findByPk(id, { include: [{ association: "zone", attributes: ["id", "name"] }] });
  }

  async updateDeliveryPartner(id, data, options = {}) {
    return await this.updateById(id, data, options);
  }
}

export default new DeliveryPartnerRepository();
