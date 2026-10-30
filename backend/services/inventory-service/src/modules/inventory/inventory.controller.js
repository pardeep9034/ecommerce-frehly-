import InventoryServices from "./inventory.service.js";
import ResponseUtil from "../../utils/response.js";
import inventoryServices from "./inventory.service.js";
import { ownStore, assertOwnStore, assertEveryStore, assertManagesStock, isSuperAdmin } from "../warehouse/warehouse.access.js";
import AppError from "../../utils/AppError.js";

class InventoryController {
  async getAllInventory(req, res, next) {
    try {
      assertEveryStore(req);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const result = await InventoryServices.getAllInventory(limit, offset);
      return ResponseUtil.success(
        res,
        result,
        "Inventory fetched successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getInventoryById(req, res, next) {
    try {
      const result = await InventoryServices.getInventoryById(req.params.id);
      assertOwnStore(req, result.warehouse_id);

      return ResponseUtil.success(
        res,
        result,
        "Inventory fetched successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getInventoryByVariantId(req, res, next) {
    const { variantId } = req.params;
    const warehouseId=req.headers["x-warehouse-id"];
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    try {
      const result = await InventoryServices.getInventoryByVariantId(
        variantId,
        warehouseId,
        offset,
        limit,
      );

      return ResponseUtil.success(
        res,
        result,
        "Inventory fetched successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }
  async getStockSummary(req, res, next) {
    try {
      const warehouseId = ownStore(req) ?? (req.query.warehouse_id ? Number(req.query.warehouse_id) : undefined);
      const result = await InventoryServices.getStockSummary(warehouseId);
      return ResponseUtil.success(res, result, "Stock summary fetched successfully");
    } catch (error) {
      next(error);
    }
  }
  async getInventoryByWarehouseId(req, res, next) {
    try {
      const { warehouseId } = req.params;
      assertOwnStore(req, warehouseId);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const result = await InventoryServices.getInventoryByWarehouseId(
        warehouseId,
        offset,
        limit,
      );

      return ResponseUtil.success(
        res,
        result,
        "Inventory fetched successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }
  async inventoryValidate(req,res,next){
    const variantIds=req.body.variantIds;
     const warehouseId=req.headers["x-warehouse-id"];
     try{
      const result = await inventoryServices.inventoryValidate(variantIds,warehouseId)
      return ResponseUtil.success(res,result,"inventory fetched",200)
         }
         catch(error){
          next(error);
         }
  }

  async getInStockVariantIds(req, res, next) {
    const variantIds = req.body.variantIds;
    const warehouseId = req.headers["x-warehouse-id"];
    try {
      const result = await inventoryServices.getInStockVariantIds(variantIds, warehouseId);
      return ResponseUtil.success(res, result, "In-stock variants fetched", 200);
    } catch (error) {
      next(error);
    }
  }

  async getStoreStock(req, res, next) {
    try {
      const warehouseId = Number(req.headers["x-warehouse-id"]);
      if (!Number.isInteger(warehouseId) || warehouseId <= 0) throw new AppError("Choose a delivery location first", 400);
      const result = await inventoryServices.getStoreStock(req.body.variantIds, warehouseId);
      return ResponseUtil.success(res, result, "Store stock fetched", 200);
    } catch (error) {
      next(error);
    }
  }

  async createInventory(req, res, next) {
    try {
      assertManagesStock(req, req.body.warehouse_id);
      const result = await InventoryServices.createInventory(req.body, req.user?.user_id);

      return ResponseUtil.success(
        res,
        result,
        "Inventory created successfully",
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  async updateInventory(req, res, next) {
    try {
      const inventory = await InventoryServices.getInventoryById(req.params.id);
      assertManagesStock(req, inventory.warehouse_id);
      const result = await InventoryServices.updateInventory(req.params.id, {
        low_stock_threshold: req.body.low_stock_threshold,
      });

      return ResponseUtil.success(
        res,
        result,
        "Inventory updated successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  // Stores never remove an item (they take its stock to 0); only the super admin can delete a row.
  async deleteInventory(req, res, next) {
    try {
      if (!req.service && !isSuperAdmin(req.user)) throw new AppError("Only the super admin can remove an item from a store", 403);
      const result = await InventoryServices.deleteInventory(req.params.id);

      return ResponseUtil.success(
        res,
        result,
        "Inventory deleted successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new InventoryController();
