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
      order: [["created_at", "DESC"]]
    });
  }
}

export default new DeliverySlotRepository();
