import BaseRepository from "./baseRepository.js";

class StockMovementRepository extends BaseRepository {
  constructor() {
    super("StockMovement");
  }

  // filters: any of { movement_type, warehouse_id }
  async getAllStockMovements(limit = 10, offset = 0, filters = {}) {
    return await this.findAndCountAll(filters, {
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });
  }

  async getStockMovementById(id) {
    return await this.findById(id);
  }

  async getStockMovementsByVariantId(variantId, limit = 10, offset = 0) {
    return await this.findAndCountAll(
      { variant_id: variantId },
      {
        limit,
        offset,
        order: [["created_at", "DESC"]],
      },
    );
  }

  async createStockMovement(data, options = {}) {
    return await this.create(data, options);
  }
}

export default new StockMovementRepository();
