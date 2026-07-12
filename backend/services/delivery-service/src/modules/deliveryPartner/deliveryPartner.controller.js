import DeliveryPartnerService from "./deliveryPartner.services.js";
import ResponseUtil from "../../utils/response.js";

class DeliveryPartnerController {
  async createDeliveryPartner(req, res, next) {
    try {
      const result = await DeliveryPartnerService.createDeliveryPartner(
        req.body,
        req.headers.authorization
      );

      return ResponseUtil.success(res, result, "Delivery partner created", 201);
    } catch (error) {
      return next(error);
    }
  }

  async getAllDeliveryPartners(req, res, next) {
    try {
      const page = Number.parseInt(req.query.page, 10) || 1;
      const limit = Number.parseInt(req.query.limit, 10) || 10;
      const offset = (page - 1) * limit;
      const result = await DeliveryPartnerService.getAllDeliveryPartners(limit, offset);

      return ResponseUtil.success(res, result, "Delivery partners fetched");
    } catch (error) {
      return next(error);
    }
  }

  async getDeliveryPartnerById(req, res, next) {
    try {
      const result = await DeliveryPartnerService.getDeliveryPartnerById(req.params.id);

      return ResponseUtil.success(res, result, "Delivery partner fetched");
    } catch (error) {
      return next(error);
    }
  }

  async updateDeliveryPartner(req, res, next) {
    try {
      const result = await DeliveryPartnerService.updateDeliveryPartner(req.params.id, req.body);

      return ResponseUtil.success(res, result, "Delivery partner updated");
    } catch (error) {
      return next(error);
    }
  }

  async updateLocation(req, res, next) {
    try {
      const result = await DeliveryPartnerService.updateLocation(req.params.id, req.body);

      return ResponseUtil.success(res, result, "Delivery partner location updated");
    } catch (error) {
      return next(error);
    }
  }

  async activateDeliveryPartner(req, res, next) {
    try {
      const result = await DeliveryPartnerService.updateStatus(req.params.id, "ACTIVE");

      return ResponseUtil.success(res, result, "Delivery partner activated");
    } catch (error) {
      return next(error);
    }
  }

  async suspendDeliveryPartner(req, res, next) {
    try {
      const result = await DeliveryPartnerService.updateStatus(req.params.id, "SUSPENDED");

      return ResponseUtil.success(res, result, "Delivery partner suspended");
    } catch (error) {
      return next(error);
    }
  }
}

export default new DeliveryPartnerController();
