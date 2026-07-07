import BaseRepository from "./baseRepository.js";

class StockReservationRepository extends BaseRepository {
  constructor() {
    super("StockReservation");
  }

  async getAllStockReservations(limit = 10, offset = 0) {
    return await this.findAndCountAll({}, {
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });
  }

  async getStockReservationById(id, options = {}) {
    return await this.findById(id, options);
  }

  async getStockReservationsByVariantId(variantId, limit = 10, offset = 0) {
    return await this.findAndCountAll(
      { variant_id: variantId },
      {
        limit,
        offset,
        order: [["created_at", "DESC"]],
      },
    );
  }

  async getStockReservationsByOrderId(orderId, limit = 10, offset = 0) {
    return await this.findAndCountAll(
      { order_id: orderId },
      {
        limit,
        offset,
        order: [["created_at", "DESC"]],
      },
    );
  }

  async createStockReservation(data, options = {}) {
    return await this.create(data, options);
  }

  async updateStockReservation(id, data, options = {}) {
    return await this.updateById(id, data, options);
  }
}

export default new StockReservationRepository();
