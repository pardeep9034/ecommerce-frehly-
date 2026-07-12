import BaseRepository from "./baseRepository.js";

class DeliveryAssignmentRepository extends BaseRepository {
  constructor() {
    super("DeliveryAssignment");
  }

  async createDeliveryAssignment(data, options = {}) {
    return await this.create(data, options);
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

  async updateDeliveryAssignment(id, data, options = {}) {
    return await this.updateById(id, data, options);
  }

  async deleteDeliveryAssignment(id, options = {}) {
    return await this.deleteById(id, options);
  }
}

export default new DeliveryAssignmentRepository();
