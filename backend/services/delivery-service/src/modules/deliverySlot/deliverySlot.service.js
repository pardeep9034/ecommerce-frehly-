import DeliverySlotRepository from "../repository/deliverySlot.repository.js";

class DeliverySlotService {
  async getActiveDeliverySlots() {
    const { rows } = await DeliverySlotRepository.getAllDeliverySlots(100, 0);
    return rows.filter((slot) => slot.is_active);
  }
}

export default new DeliverySlotService();
