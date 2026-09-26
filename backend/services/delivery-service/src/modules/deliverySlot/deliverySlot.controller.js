import DeliverySlotService from "./deliverySlot.service.js";
import ResponseUtil from "../../utils/response.js";

class DeliverySlotController {
  async getActiveDeliverySlots(req, res, next) {
    try {
      const result = await DeliverySlotService.getActiveDeliverySlots();
      return ResponseUtil.success(res, result, "Delivery slots fetched");
    } catch (error) {
      next(error);
    }
  }
}

export default new DeliverySlotController();
