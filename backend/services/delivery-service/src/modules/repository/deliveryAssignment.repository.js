import { Op, Sequelize } from "sequelize";
import BaseRepository from "./baseRepository.js";

class DeliveryAssignmentRepository extends BaseRepository {
  constructor() {
    super("DeliveryAssignment");
  }

  async createDeliveryAssignment(data, options = {}) {
    return await this.create(data, options);
  }
  getActiveAssignmentsByPartnerId(delivery_partner_id, options = {}) {
    return this.findAll({
      where: {
        delivery_partner_id,
        status: "ACTIVE"
      },
      ...options
    });
  }

  async getDeliveryAssignmentById(id, options = {}) {
    return await this.findById(id, {
      include: [
        { association: "deliveryPartner" },
        { association: "deliverySlot" }
      ],
      ...options
    });
  }

  async getDeliveryAssignmentByOrderId(orderId, options = {}) {
    return await this.findOne({ order_id: orderId }, {
      include: [
        { association: "deliveryPartner" },
        { association: "deliverySlot" }
      ],
      ...options
    });
  }

  async getAllDeliveryAssignments(limit = 10, offset = 0) {
    return await this.findAndCountAll({}, {
      include: [
        { association: "deliveryPartner" },
        { association: "deliverySlot" }
      ],
      limit,
      offset,
      order: [["created_at", "DESC"]]
    });
  }

  // { partnerId: completedCount } for assignments completed since `since`.
  // ponytail: no completed_at column, so updated_at of a COMPLETED row stands in;
  // add a real completed_at if completed rows ever get edited afterwards.
  async countCompletedSince(partnerIds, since) {
    if (partnerIds.length === 0) return {};
    const Model = await this.getModel();
    const rows = await Model.findAll({
      attributes: ["delivery_partner_id", [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]],
      where: { delivery_partner_id: partnerIds, status: "COMPLETED", updated_at: { [Op.gte]: since } },
      group: ["delivery_partner_id"],
      raw: true
    });
    return Object.fromEntries(rows.map((row) => [row.delivery_partner_id, Number(row.count)]));
  }

  // One partner's assignments, newest first (the partner app's lists). `statuses` are assignment status values and `since`
  // keeps rows changed on or after it, which for a finished assignment is when it finished (see countCompletedSince).
  async findForPartner(partnerId, { statuses, since, limit, offset }) {
    const where = { delivery_partner_id: partnerId, status: statuses };
    if (since) where.updated_at = { [Op.gte]: since };
    // Open work newest-assigned first; finished work most-recently-finished first (the History screen groups by that day).
    const sortBy = statuses.includes("ACTIVE") ? "created_at" : "updated_at";
    return await this.findAndCountAll(where, { limit, offset, order: [[sortBy, "DESC"], ["id", "DESC"]] });
  }

  // { COMPLETED: n, FAILED: n, ... } for one partner's assignments that changed on or after `since`.
  async countByStatusSince(partnerId, since) {
    const Model = await this.getModel();
    const rows = await Model.findAll({
      attributes: ["status", [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]],
      where: { delivery_partner_id: partnerId, updated_at: { [Op.gte]: since } },
      group: ["status"],
      raw: true
    });
    return Object.fromEntries(rows.map((row) => [row.status, Number(row.count)]));
  }

  async updateDeliveryAssignment(id, data, options = {}) {
    return await this.updateById(id, data, options);
  }

  async deleteDeliveryAssignment(id, options = {}) {
    return await this.deleteById(id, options);
  }
}

export default new DeliveryAssignmentRepository();
