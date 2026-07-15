import BaseRepository from "./baseRepository.js";

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

  async getAllDeliveryZones(limit = 10, offset = 0) {
    return await this.findAndCountAll({}, {
      limit,
      offset,
      order: [["created_at", "DESC"]]
    });
  }

  async updateDeliveryZone(id, data, options = {}) {
    return await this.updateById(id, data, options);
  }

  async deleteDeliveryZone(id, options = {}) {
    return await this.deleteById(id, options);
  }
}

export default new DeliveryZoneRepository();
