import { Op, Sequelize } from "sequelize";
import BaseRepository from "./baseRepository.js";

// warehouse + search narrow the set; status is applied on top for the list, but not for the counts.
// Search matches the order id (as text) or any of `variantIds` (found by product name elsewhere).
const buildWhere = ({ warehouseId, search, variantIds = [] } = {}) => {
  const where = {};
  if (warehouseId) where.warehouse_id = warehouseId;
  if (search) {
    const like = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
    where[Op.or] = [
      Sequelize.where(Sequelize.cast(Sequelize.col("order_id"), "text"), { [Op.like]: like }),
      ...(variantIds.length ? [{ variant_id: { [Op.in]: variantIds } }] : []),
    ];
  }
  return where;
};

class StockReservationRepository extends BaseRepository {
  constructor() {
    super("StockReservation");
  }

  async getAllStockReservations(limit = 10, offset = 0, { status, ...filters } = {}) {
    const where = buildWhere(filters);
    if (status) where.status = status;
    return await this.findAndCountAll(where, {
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });
  }

  // { ACTIVE: n, CONFIRMED: n, ... } for the warehouse/search set, whatever status or page is showing.
  async countByStatus(filters) {
    const Model = await this.getModel();
    const rows = await Model.count({ where: buildWhere(filters), group: ["status"] });
    return Object.fromEntries(rows.map(({ status, count }) => [status, Number(count)]));
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
