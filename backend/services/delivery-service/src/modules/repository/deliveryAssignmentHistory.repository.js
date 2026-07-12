import BaseRepository from "./baseRepository.js";

class DeliveryAssignmentHistoryRepository extends BaseRepository {
  constructor() {
    super("DeliveryAssignmentHistory");
  }

  async createAssignmentHistory(data, options = {}) {
    return await this.create(data, options);
  }

  async getHistoryByOrderId(orderId, options = {}) {
    return await this.findAll({ order_id: orderId }, {
      order: [["changed_at", "DESC"]],
      ...options
    });
  }
}

export default new DeliveryAssignmentHistoryRepository();
