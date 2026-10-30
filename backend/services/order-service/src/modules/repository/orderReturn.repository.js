import BaseRepository from "./baseRepository.js";

class OrderReturnRepository extends BaseRepository {
  constructor() {
    super("OrderReturn");
  }

  async createReturns(rows, options = {}) {
    return await this.bulkCreate(rows, options);
  }

  async getReturnsByOrderId(orderId, options = {}) {
    return await this.findAll({ order_id: orderId }, { order: [["id", "ASC"]], ...options });
  }

  async updateReturn(id, data, options = {}) {
    return await this.updateById(id, data, options);
  }

  // The one read that includes the photo (the model's default scope leaves it out).
  async getPhoto(orderId, id) {
    const Model = await this.getModel();
    return await Model.unscoped().findOne({ where: { id, order_id: orderId }, attributes: ["id", "photo"] });
  }

  // Newest first, with the order and item each return belongs to. warehouseId limits it to one store's orders.
  async findReturns({ statuses = [], warehouseId = null, limit = 100 } = {}) {
    return await this.findAll(statuses.length ? { status: statuses } : {}, {
      include: [
        {
          association: "order",
          attributes: ["id", "order_number", "status", "warehouse_id", "user_id", "collected_method"],
          ...(warehouseId ? { where: { warehouse_id: warehouseId } } : {})
        },
        { association: "item", attributes: ["id", "product_name", "variant_name", "variant_id", "unit", "quantity", "line_total"] }
      ],
      order: [["created_at", "DESC"]],
      limit
    });
  }
}

export default new OrderReturnRepository();
