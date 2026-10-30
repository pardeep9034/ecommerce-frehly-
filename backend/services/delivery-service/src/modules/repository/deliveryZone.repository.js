import { Op, Sequelize } from "sequelize";
import BaseRepository from "./baseRepository.js";

const escapeLike = (text) => text.replace(/[\\%_]/g, "\\$&");

class DeliveryZoneRepository extends BaseRepository {
  constructor() {
    super("DeliveryZone");
  }

  async createDeliveryZone(data, options = {}) {
    return await this.create(data, options);
  }

  async getDeliveryZoneById(id, options = {}) {
    return await this.findById(id, options);
  }

  async getDeliveryZoneByCode(code, options = {}) {
    return await this.findOne({ code }, options);
  }

  // `city` matches exactly, any case; `search` is part of the name or code.
  async getAllDeliveryZones(limit = 10, offset = 0, { city, search } = {}) {
    const where = {};
    if (city) where.city = { [Op.iLike]: escapeLike(city) };
    if (search) where[Op.or] = ["name", "code"].map((field) => ({ [field]: { [Op.iLike]: `%${escapeLike(search)}%` } }));
    return await this.findAndCountAll(where, {
      limit,
      offset,
      order: [["created_at", "DESC"]]
    });
  }

  // Every city that has a zone, A to Z. ponytail: DISTINCT over the zone table; add an index on city past a few
  // thousand zones, or a cities table once a city carries its own settings.
  async getCities() {
    const rows = await this.findAll({}, {
      attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("city")), "city"]],
      order: [["city", "ASC"]],
      raw: true
    });
    return rows.map((row) => row.city);
  }

  async getActiveZones() {
    return await this.findAll({ is_active: true });
  }

  async updateDeliveryZone(id, data, options = {}) {
    return await this.updateById(id, data, options);
  }

  async deleteDeliveryZone(id, options = {}) {
    return await this.deleteById(id, options);
  }
}

export default new DeliveryZoneRepository();
