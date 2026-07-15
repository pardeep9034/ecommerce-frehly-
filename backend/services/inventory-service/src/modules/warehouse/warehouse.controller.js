import WarehouseService from "./warehouse.services.js";
import ResponseUtil from "../../utils/response.js";

class WarehouseController {
  async getAllWarehouses(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const result = await WarehouseService.getAllWarehouses(limit, offset);
      return ResponseUtil.success(res, result, "Warehouses fetched successfully");
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
      const result = await WarehouseService.createWarehouse(req.body);
      return ResponseUtil.success(res, result, "Warehouse created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async updateWarehouse(req, res, next) {
    try {
      const result = await WarehouseService.updateWarehouse(req.params.id, req.body);
      return ResponseUtil.success(res, result, "Warehouse updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteWarehouse(req, res, next) {
    try {
      const result = await WarehouseService.deleteWarehouse(req.params.id);
      return ResponseUtil.success(res, result, "Warehouse deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}

export default new WarehouseController();
