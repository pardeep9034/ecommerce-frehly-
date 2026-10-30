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

  async getAllDeliverySlots(req, res, next) {
    try {
      const result = await DeliverySlotService.getAllDeliverySlots();
      return ResponseUtil.success(res, result, "Delivery slots fetched");
    } catch (error) {
      next(error);
    }
  }

  async createDeliverySlot(req, res, next) {
    try {
      const result = await DeliverySlotService.createDeliverySlot(req.body);
      return ResponseUtil.success(res, result, "Delivery slot created", 201);
    } catch (error) {
      next(error);
    }
  }

  async updateDeliverySlot(req, res, next) {
    try {
      const result = await DeliverySlotService.updateDeliverySlot(req.params.id, req.body);
      return ResponseUtil.success(res, result, "Delivery slot updated");
    } catch (error) {
      next(error);
    }
  }
}

export default new DeliverySlotController();
