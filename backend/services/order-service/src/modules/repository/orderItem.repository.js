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

  async updateItem(id, data, options = {}) {
    return await this.updateById(id, data, options);
  }
}

export default new OrderItemRepository();
