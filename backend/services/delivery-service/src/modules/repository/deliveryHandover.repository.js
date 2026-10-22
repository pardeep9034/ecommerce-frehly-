import { Op } from "sequelize";
import BaseRepository from "./baseRepository.js";

// Statuses where the handover is still waiting on someone.
export const OPEN_HANDOVER = ["PENDING", "OLD_PARTNER_CONFIRMED"];

class DeliveryHandoverRepository extends BaseRepository {
  constructor() {
    super("DeliveryHandover");
  }

  async createDeliveryHandover(data, options = {}) {
    return await this.create(data, options);
  }

  async getHandoversByOrderId(orderId, options = {}) {
    return await this.findAll({ order_id: orderId }, {
      order: [["created_at", "DESC"]],
      ...options
    });
  }

  async findOpenForAssignment(assignmentId, options = {}) {
    return await this.findOne({ assignment_id: assignmentId, status: OPEN_HANDOVER }, options);
  }

  // A partner's handovers in one direction ("in" = they receive, "out" = they give): every open one, plus finished ones
  // requested on or after `since`. Newest first.
  async listForPartner(partnerId, dir, since) {
    return await this.findAll(
      {
        [dir === "in" ? "new_delivery_partner_id" : "old_delivery_partner_id"]: partnerId,
        [Op.or]: [{ status: OPEN_HANDOVER }, { created_at: { [Op.gte]: since } }],
      },
      { order: [["created_at", "DESC"]], limit: 50 },
    );
  }

  // { given, received } completed handovers for one partner, requested on or after `since` (no completion time is stored;
  // a handover finishes within minutes of its request).
  async countForPartner(partnerId, since) {
    const Model = await this.getModel();
    const where = { status: "COMPLETED", created_at: { [Op.gte]: since } };
    const [given, received] = await Promise.all([
      Model.count({ where: { ...where, old_delivery_partner_id: partnerId } }),
      Model.count({ where: { ...where, new_delivery_partner_id: partnerId } }),
    ]);
    return { given, received };
  }
}

export default new DeliveryHandoverRepository();
