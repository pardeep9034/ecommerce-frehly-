import DeliveryZoneService from "./deliveryZone.services.js";
import ResponseUtil from "../../utils/response.js";

class DeliveryZoneController {
  async createDeliveryZone(req, res, next) {
    try {
      const result = await DeliveryZoneService.createDeliveryZone(req.body);
      return ResponseUtil.success(res, result, "Delivery zone created", 201);
    } catch (error) {
       next(error);
    }
  }

  async getAllDeliveryZones(req, res, next) {
    try {
      const page = Number.parseInt(req.query.page, 10) || 1;
      const limit = Number.parseInt(req.query.limit, 10) || 10;
      const offset = (page - 1) * limit;
      const result = await DeliveryZoneService.getAllDeliveryZones(limit, offset);
      return ResponseUtil.success(res, result, "Delivery zones fetched");
    } catch (error) {
       next(error);
    }
  }

  async getDeliveryZoneById(req, res, next) {
    try {
      const result = await DeliveryZoneService.getDeliveryZoneById(req.params.id);
      return ResponseUtil.success(res, result, "Delivery zone fetched");
    } catch (error) {
       next(error);
    }
  }
  

  async updateDeliveryZone(req, res, next) {
    try {
      const result = await DeliveryZoneService.updateDeliveryZone(req.params.id, req.body);
      return ResponseUtil.success(res, result, "Delivery zone updated");
    } catch (error) {
     next(error);
    }
  }

  async deleteDeliveryZone(req, res, next) {
    try {
      await DeliveryZoneService.deleteDeliveryZone(req.params.id);
      return ResponseUtil.success(res, null, "Delivery zone deleted");
    } catch (error) {
       next(error);
    }
  }
}

export default new DeliveryZoneController();
