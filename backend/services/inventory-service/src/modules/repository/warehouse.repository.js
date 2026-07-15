import BaseRepository from "./baseRepository.js";

class WarehouseRepository extends BaseRepository {
  constructor() {
    super("Warehouse");
  }

  async getAllWarehouses(limit = 10, offset = 0) {
    return await this.findAndCountAll({}, {
      limit,
      offset,
      order: [["created_at", "DESC"]]
    });
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
