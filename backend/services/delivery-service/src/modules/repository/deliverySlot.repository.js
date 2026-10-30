import BaseRepository from "./baseRepository.js";

class DeliverySlotRepository extends BaseRepository {
  constructor() {
    super("DeliverySlot");
  }

  async createDeliverySlot(data, options = {}) {
    return await this.create(data, options);
  }

  async getDeliverySlotById(id, options = {}) {
    return await this.findById(id, options);
  }

  async getAllDeliverySlots(limit = 10, offset = 0) {
    return await this.findAndCountAll({}, {
      limit,
      offset,
      order: [["start_time", "ASC"], ["name", "ASC"]]
    });
  }

  async updateDeliverySlot(id, data, options = {}) {
    return await this.updateById(id, data, options);
  }
}

export default new DeliverySlotRepository();
