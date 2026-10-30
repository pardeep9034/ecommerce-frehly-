import WarehouseService from "./warehouse.service.js";
import ResponseUtil from "../../utils/response.js";

// Who is asking: a staff token (req.user), or a sibling service with the internal key (req.service, no user).
// The token goes along so a delete can count the store's orders and staff as this caller.
const caller = (req) => ({ user: req.user ?? null, service: Boolean(req.service), authorization: req.headers.authorization });

class WarehouseController {
  async getAllWarehouses(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      // Not a Joi schema on purpose: delivery-service reads this list with limit=1000.
      const city = typeof req.query.city === "string" ? req.query.city.trim().slice(0, 100) : "";
      const result = await WarehouseService.getAllWarehouses(limit, offset, { city });
      return ResponseUtil.success(res, result, "Warehouses fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async getCities(req, res, next) {
    try {
      const result = await WarehouseService.getCities();
      return ResponseUtil.success(res, result, "Warehouse cities fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async getWarehouseById(req, res, next) {
    try {
      const result = await WarehouseService.getWarehouseById(req.params.id);
      return ResponseUtil.success(res, result, "Warehouse fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async createWarehouse(req, res, next) {
    try {
      const result = await WarehouseService.createWarehouse(req.body, caller(req));
      return ResponseUtil.success(res, result, "Warehouse created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async updateWarehouse(req, res, next) {
    try {
      const result = await WarehouseService.updateWarehouse(req.params.id, req.body, caller(req));
      return ResponseUtil.success(res, result, "Warehouse updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteWarehouse(req, res, next) {
    try {
      const result = await WarehouseService.deleteWarehouse(req.params.id, caller(req));
      return ResponseUtil.success(res, result, "Warehouse deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}

export default new WarehouseController();
