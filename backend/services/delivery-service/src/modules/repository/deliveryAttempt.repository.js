import BaseRepository from "./baseRepository.js";

class DeliveryAttemptRepository extends BaseRepository {
  constructor() {
    super("DeliveryAttempt");
  }

  async createDeliveryAttempt(data, options = {}) {
    return await this.create(data, options);
  }

  async getAttemptsByOrderId(orderId, options = {}) {
    return await this.findAll({ order_id: orderId }, {
      order: [["attempted_at", "DESC"]],
      ...options
    });
  }
}

export default new DeliveryAttemptRepository();
