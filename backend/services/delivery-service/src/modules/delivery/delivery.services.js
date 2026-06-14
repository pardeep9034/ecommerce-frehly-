import DeliveryRepository from "../repository/delivery.repository.js";

const DeliveryServices = {
  async getAllDeliveries() {
    return await new DeliveryRepository().getAllDeliveries();
  },

  async getDeliveryById(id) {
    return await new DeliveryRepository().getDeliveryById(id);
  },

  async createDelivery(deliveryData) {
    return await new DeliveryRepository().createDelivery(deliveryData);
  },

  async updateDelivery(id, deliveryData) {
    return await new DeliveryRepository().updateDelivery(id, deliveryData);
  },

  async deleteDelivery(id) {
    return await new DeliveryRepository().deleteDelivery(id);
  },

  async getDeliveryByOrderId(orderId) {
    return await new DeliveryRepository().getDeliveryByOrderId(orderId);
  }
};

export default DeliveryServices;
