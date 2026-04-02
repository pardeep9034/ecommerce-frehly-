import { initializeModels } from "../../models/index.js";

class DeliveryRepository {
  async getAllDeliveries() {
    const db = await initializeModels();
    return await db.Delivery.findAll({
      order: [["createdAt", "DESC"]]
    });
  }

  async getDeliveryById(id) {
    const db = await initializeModels();
    return await db.Delivery.findByPk(id);
  }

  async createDelivery(deliveryData) {
    const db = await initializeModels();
    return await db.Delivery.create(deliveryData);
  }

  async updateDelivery(id, deliveryData) {
    const db = await initializeModels();
    return await db.Delivery.update(deliveryData, { where: { id } });
  }

  async deleteDelivery(id) {
    const db = await initializeModels();
    return await db.Delivery.destroy({ where: { id } });
  }

  async getDeliveryByOrderId(orderId) {
    const db = await initializeModels();
    return await db.Delivery.findOne({ where: { orderId } });
  }
}

export default DeliveryRepository;
