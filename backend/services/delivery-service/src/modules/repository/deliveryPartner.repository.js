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

  async getDeliveryPartnerByVehicleNumber(vehicleNumber, options = {}) {
    return await this.findOne({ vehicle_number: vehicleNumber }, options);
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

  async updateDeliveryPartner(id, data, options = {}) {
    return await this.updateById(id, data, options);
  }
}

export default new DeliveryPartnerRepository();
