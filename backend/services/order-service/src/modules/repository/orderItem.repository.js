import BaseRepository from "./baseRepository.js";

class OrderItemRepository extends BaseRepository {
  constructor() {
    super("OrderItem");
  }

  async createOrderItems(orderItems, options = {}) {
    return await this.bulkCreate(orderItems, options);
  }

  async getItemsByOrderId(orderId, options = {}) {
    return await this.findAll({ order_id: orderId }, options);
  }
}

export default new OrderItemRepository();
