import { Op } from "sequelize";
import BaseRepository from "./baseRepository.js";

class OrderRepository extends BaseRepository {
  constructor() {
    super("Order");
  }

  async createOrder(orderData, options = {}) {
    return await this.create(orderData, options);
  }

  async getOrderById(id, options = {}) {
    return await this.findById(id, options);
  }

  async getOrderDetails(id, options = {}) {
    return await this.findById(id, {
      include: [
        { association: "items" },
        { association: "address" },
        { association: "payments" },
        { association: "statusHistory" }
      ],
      ...options
    });
  }

  async getOrderWithItems(id, options = {}) {
    return await this.findById(id, {
      include: [{ association: "items" }],
      ...options
    });
  }

  async getOrderHistory(where = {}, limit = 10, offset = 0) {
    return await this.findAndCountAll(where, {
      include: [
        { association: "payments", limit: 1, order: [["created_at", "DESC"]] }
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset
    });
  }

  async getExpiredPendingPayments(expiryTime) {
    return await this.findAll({
      status: "PENDING_PAYMENT",
      payment_status: "PENDING",
      created_at: { [Op.lt]: expiryTime }
    });
  }

  async updateOrder(id, orderData, options = {}) {
    return await this.updateById(id, orderData, options);
  }
}

export default new OrderRepository();
