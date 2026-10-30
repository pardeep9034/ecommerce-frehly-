import DeliveryPartnerService from "./deliveryPartner.service.js";
import PartnerMeService from "../partnerMe/partnerMe.service.js";
import ResponseUtil from "../../utils/response.js";
import { ownStore } from "../../utils/ownStore.js";

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
      const zone_id = Number.parseInt(req.query.zone_id, 10);
      const result = await DeliveryPartnerService.getAllDeliveryPartnersByZoneId(zone_id);

      return ResponseUtil.success(res, result, "Delivery partners fetched");
    } catch (error) {
      next(error);
    }
  }
  async getAvalableDeliveryPartners(req, res, next){
    try{
      // Store accounts get their own store (from the token); the super admin picks one with the header.
      const warehouseId = ownStore(req.user) ?? req.headers["x-warehouse-id"];
      const result = await DeliveryPartnerService.getAvalableDeliveryPartners(warehouseId);
      return ResponseUtil.success(res, result, "Available delivery partners fetched");

    }catch(error){
      next(error)}
  }

  async listPartners(req, res, next) {
    try {
      const result = await DeliveryPartnerService.listPartners(req.query);

      return ResponseUtil.success(res, result, "Delivery partners fetched");
    } catch (error) {
      next(error);
    }
  }


  async getWork(req, res, next) {
    try {
      const result = await PartnerMeService.getWork(req.params.id);

      return ResponseUtil.success(res, result, "Partner work fetched");
    } catch (error) {
      next(error);
    }
  }

  async getOnboarding(req, res, next) {
    try {
      const result = await DeliveryPartnerService.getOnboarding(req.params.id);

      return ResponseUtil.success(res, result, "Onboarding record fetched");
    } catch (error) {
      next(error);
    }
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
