import DeliveryAssignmentRepository from "./deliveryAssignment.repository.js";

class DeliveryRepository {
  async getAllDeliveries() {
    const { rows } = await DeliveryAssignmentRepository.getAllDeliveryAssignments(100, 0);
    return rows;
  }

  async getDeliveryById(id) {
    return await DeliveryAssignmentRepository.getDeliveryAssignmentById(id);
  }

  async createDelivery(deliveryData) {
    return await DeliveryAssignmentRepository.createDeliveryAssignment(deliveryData);
  }

  async updateDelivery(id, deliveryData) {
    return await DeliveryAssignmentRepository.updateDeliveryAssignment(id, deliveryData);
  }

  async deleteDelivery(id) {
    return await DeliveryAssignmentRepository.deleteDeliveryAssignment(id);
  }

  async getDeliveryByOrderId(orderId) {
    return await DeliveryAssignmentRepository.getDeliveryAssignmentByOrderId(orderId);
  }
}

export default DeliveryRepository;
