import { Op, Sequelize } from "sequelize";
import BaseRepository from "./baseRepository.js";

class WarehouseRepository extends BaseRepository {
  constructor() {
    super("Warehouse");
  }

  // `city` matches exactly, any case.
  async getAllWarehouses(limit = 10, offset = 0, { city } = {}) {
    const where = city ? { city: { [Op.iLike]: city.replace(/[\\%_]/g, "\\$&") } } : {};
    return await this.findAndCountAll(where, {
      limit,
      offset,
      order: [["created_at", "DESC"]]
    });
  }

  // Every city that has a warehouse, A to Z. ponytail: DISTINCT over the warehouse table; fine for hundreds of stores.
  async getCities() {
    const Model = await this.getModel();
    const rows = await Model.findAll({
      attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("city")), "city"]],
      where: { city: { [Op.ne]: null } },
      order: [["city", "ASC"]],
      raw: true
    });
    return rows.map((row) => row.city).filter(Boolean);
  }

  async getWarehouseById(id) {
    return await this.findById(id);
  }

  async createWarehouse(data) {
    return await this.create(data);
  }

  async updateWarehouse(id, data) {
    return await this.updateById(id, data);
  }

  async deleteWarehouse(id) {
    return await this.deleteById(id);
  }
}

export default new WarehouseRepository();
