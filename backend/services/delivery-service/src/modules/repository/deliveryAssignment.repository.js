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

  // The newest one: an order that failed delivery can be assigned again, so it may have several.
  async getDeliveryAssignmentByOrderId(orderId, options = {}) {
    return await this.findOne({ order_id: orderId }, {
      order: [["assigned_at", "DESC"], ["created_at", "DESC"]],
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
  async countCompletedSince(partnerIds, since) {
    if (partnerIds.length === 0) return {};
    const Model = await this.getModel();
    const rows = await Model.findAll({
      attributes: ["delivery_partner_id", [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]],
      where: { delivery_partner_id: partnerIds, status: "COMPLETED", completed_at: { [Op.gte]: since } },
      group: ["delivery_partner_id"],
      raw: true
    });
    return Object.fromEntries(rows.map((row) => [row.delivery_partner_id, Number(row.count)]));
  }

  // Where clause for one partner's assignments: finished in [from, to) and matching `search` (an order number, or part of
  // the customer's name). A time range only ever matches finished work, since open work has no completed_at.
  partnerWhere(partnerId, { from, to, search } = {}) {
    const where = { delivery_partner_id: partnerId };
    if (from || to) where.completed_at = { ...(from && { [Op.gte]: from }), ...(to && { [Op.lt]: to }) };
    if (search) {
      where[Op.or] = [{ customer_name: { [Op.iLike]: `%${search.replace(/[\\%_]/g, "\\$&")}%` } }];
      if (/^\d{1,18}$/.test(search)) where[Op.or].push({ order_id: search });
    }
    return where;
  }

  // One partner's assignments, newest first (the partner app's lists). `statuses` are assignment status values.
  async findForPartner(partnerId, { statuses, limit, offset, ...filters }) {
    const where = { ...this.partnerWhere(partnerId, filters), status: statuses };
    // Open work newest-assigned first; finished work most-recently-finished first (the History screen groups by that day).
    const order = statuses.includes("ACTIVE") ? [["created_at", "DESC"]] : [["completed_at", "DESC NULLS LAST"]];
    return await this.findAndCountAll(where, { limit, offset, order: [...order, ["id", "DESC"]] });
  }

  // { COMPLETED: n, FAILED: n, ... } for one partner's assignments under the same filters as findForPartner.
  async countByStatus(partnerId, filters) {
    const Model = await this.getModel();
    const rows = await Model.findAll({
      attributes: ["status", [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]],
      where: this.partnerWhere(partnerId, filters),
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
