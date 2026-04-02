import DeliveryServices from "./delivery.services.js";
import ResponseUtil from "../../utils/response.js";

const DeliveryController = {
  async getAllDeliveries(req, res) {
    try {
      const deliveries = await DeliveryServices.getAllDeliveries();
      return ResponseUtil.success(res, deliveries);
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  },

  async getDeliveryById(req, res) {
    try {
      const delivery = await DeliveryServices.getDeliveryById(req.params.id);
      if (!delivery) return ResponseUtil.notFound(res, "Delivery not found");
      return ResponseUtil.success(res, delivery);
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  },

  async createDelivery(req, res) {
    try {
      const delivery = await DeliveryServices.createDelivery(req.body);
      return ResponseUtil.success(res, delivery, "Delivery created", 201);
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  },

  async updateDelivery(req, res) {
    try {
      const updated = await DeliveryServices.updateDelivery(req.params.id, req.body);
      if (updated[0] === 0) return ResponseUtil.notFound(res, "Delivery not found");
      return ResponseUtil.success(res, null, "Delivery updated");
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  },

  async deleteDelivery(req, res) {
    try {
      const deleted = await DeliveryServices.deleteDelivery(req.params.id);
      if (deleted === 0) return ResponseUtil.notFound(res, "Delivery not found");
      return ResponseUtil.success(res, null, "Delivery deleted");
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  }
};

export default DeliveryController;
