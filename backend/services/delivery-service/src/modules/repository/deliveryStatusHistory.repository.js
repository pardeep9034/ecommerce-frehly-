import BaseRepository from "./baseRepository.js";

class DeliveryStatusHistoryRepository extends BaseRepository {
  constructor() {
    super("DeliveryStatusHistory");
  }

  async createStatusHistory(data, options = {}) {
    return await this.create(data, options);
  }

  async getStatusHistoryByOrderId(orderId, options = {}) {
    return await this.findAll({ order_id: orderId }, {
      order: [["created_at", "ASC"]],
      ...options
    });
  }
}

export default new DeliveryStatusHistoryRepository();
