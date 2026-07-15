import DeliveryPartnerZoneService from "./deliveryPartnerZone.services.js";
import ResponseUtil from "../../utils/response.js";

class DeliveryPartnerZoneController {
  async createDeliveryPartnerZone(req, res, next) {
    try {
      const result = await DeliveryPartnerZoneService.createDeliveryPartnerZone(req.body);
      return ResponseUtil.success(res, result, "Delivery partner zone created", 201);
    } catch (error) {
      return next(error);
    }
  }

  async getAllDeliveryPartnerZones(req, res, next) {
    try {
      const page = Number.parseInt(req.query.page, 10) || 1;
      const limit = Number.parseInt(req.query.limit, 10) || 10;
      const offset = (page - 1) * limit;
      const result = await DeliveryPartnerZoneService.getAllDeliveryPartnerZones(limit, offset);
      return ResponseUtil.success(res, result, "Delivery partner zones fetched");
    } catch (error) {
      return next(error);
    }
  }

  async getDeliveryPartnerZoneById(req, res, next) {
    try {
      const result = await DeliveryPartnerZoneService.getDeliveryPartnerZoneById(req.params.id);
      return ResponseUtil.success(res, result, "Delivery partner zone fetched");
    } catch (error) {
      return next(error);
    }
  }

  async getZonesByPartner(req, res, next) {
    try {
      const result = await DeliveryPartnerZoneService.getZonesByPartner(req.params.deliveryPartnerId);
      return ResponseUtil.success(res, result, "Delivery partner zones fetched");
    } catch (error) {
      return next(error);
    }
  }

  async updateDeliveryPartnerZone(req, res, next) {
    try {
      const result = await DeliveryPartnerZoneService.updateDeliveryPartnerZone(
        req.params.id,
        req.body
      );
      return ResponseUtil.success(res, result, "Delivery partner zone updated");
    } catch (error) {
      return next(error);
    }
  }

  async deleteDeliveryPartnerZone(req, res, next) {
    try {
      await DeliveryPartnerZoneService.deleteDeliveryPartnerZone(req.params.id);
      return ResponseUtil.success(res, null, "Delivery partner zone deleted");
    } catch (error) {
      return next(error);
    }
  }
}

export default new DeliveryPartnerZoneController();
