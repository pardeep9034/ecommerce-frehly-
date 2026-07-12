import BaseRepository from "./baseRepository.js";

class OrderStatusHistoryRepository extends BaseRepository {
  constructor() {
    super("OrderStatusHistory");
  }

  async createStatusHistory(historyData, options = {}) {
    return await this.create(historyData, options);
  }

  async getHistoryByOrderId(orderId, options = {}) {
    return await this.findAll(
      { order_id: orderId },
      {
        order: [["created_at", "ASC"]],
        ...options
      }
    );
  }
}

export default new OrderStatusHistoryRepository();
