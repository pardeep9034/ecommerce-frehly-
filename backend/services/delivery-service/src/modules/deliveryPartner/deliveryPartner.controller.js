import DeliveryPartnerService from "./deliveryPartner.services.js";
import ResponseUtil from "../../utils/response.js";

class DeliveryPartnerController {
  async createDeliveryPartner(req, res, next) {
    try {
      const result = await DeliveryPartnerService.createDeliveryPartner(
        req.body,
        req.user
      );

      return ResponseUtil.success(res, result, "Delivery partner created", 201);
    } catch (error) {
       next(error);
    }
  }

  async getAllDeliveryPartnersByZoneId(req, res, next) {
    try {
      // const page = Number.parseInt(req.query.page, 10) || 1;
      // const limit = Number.parseInt(req.query.limit, 10) || 10;
      const zone_id = Number.parseInt(req.query.zone_id, 10);
    
      const offset = (page - 1) * limit;
      const result = await DeliveryPartnerService.getAllDeliveryPartnersByZoneId(zone_id);

      return ResponseUtil.success(res, result, "Delivery partners fetched");
    } catch (error) {
      next(error);
    }
  }
  async getAvalableDeliveryPartners(res,req,next){
    try{
      const warehouseId = req.header("X-Warehouse-Id");
      const result = await DeliveryPartnerService.getAvalableDeliveryPartners(warehouseId);
      return ResponseUtil.success(res, result, "Available delivery partners fetched");

    }catch(error){
      next(error)}
  }

  async getDeliveryPartnerById(req, res, next) {
    try {
      const result = await DeliveryPartnerService.getDeliveryPartnerById(req.params.id);

      return ResponseUtil.success(res, result, "Delivery partner fetched");
    } catch (error) {
       next(error);
    }
  }

  async updateDeliveryPartner(req, res, next) {
    try {
      const result = await DeliveryPartnerService.updateDeliveryPartner(req.params.id, req.body);

      return ResponseUtil.success(res, result, "Delivery partner updated");
    } catch (error) {
      next(error);
    }
  }

  async updateLocation(req, res, next) {
    try {
      const result = await DeliveryPartnerService.updateLocation(req.params.id, req.body);

      return ResponseUtil.success(res, result, "Delivery partner location updated");
    } catch (error) {
      next(error);
    }
  }

  async activateDeliveryPartner(req, res, next) {
    try {
      const result = await DeliveryPartnerService.updateStatus(req.params.id, "ACTIVE");

      return ResponseUtil.success(res, result, "Delivery partner activated");
    } catch (error) {
       next(error);
    }
  }

  async suspendDeliveryPartner(req, res, next) {
    try {
      const result = await DeliveryPartnerService.updateStatus(req.params.id, "SUSPENDED");

      return ResponseUtil.success(res, result, "Delivery partner suspended");
    } catch (error) {
       next(error);
    }
  }
}

export default new DeliveryPartnerController();
