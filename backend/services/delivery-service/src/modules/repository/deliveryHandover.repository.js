import BaseRepository from "./baseRepository.js";

class DeliveryHandoverRepository extends BaseRepository {
  constructor() {
    super("DeliveryHandover");
  }

  async createDeliveryHandover(data, options = {}) {
    return await this.create(data, options);
  }

  async getHandoversByOrderId(orderId, options = {}) {
    return await this.findAll({ order_id: orderId }, {
      order: [["created_at", "DESC"]],
      ...options
    });
  }
}

export default new DeliveryHandoverRepository();
