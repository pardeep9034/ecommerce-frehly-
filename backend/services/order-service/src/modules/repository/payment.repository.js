import BaseRepository from "./baseRepository.js";

class PaymentRepository extends BaseRepository {
  constructor() {
    super("Payment");
  }

  async createPayment(paymentData, options = {}) {
    return await this.create(paymentData, options);
  }

  async getPendingPayment(orderId, options = {}) {
    return await this.findOne(
      {
        order_id: orderId,
        status: "PENDING"
      },
      {
        order: [["created_at", "DESC"]],
        ...options
      }
    );
  }

  async getSuccessfulPayment(orderId, options = {}) {
    return await this.findOne(
      {
        order_id: orderId,
        status: "SUCCESS"
      },
      {
        order: [["created_at", "DESC"]],
        ...options
      }
    );
  }

  async updatePayment(id, paymentData, options = {}) {
    return await this.updateById(id, paymentData, options);
  }
}

export default new PaymentRepository();
