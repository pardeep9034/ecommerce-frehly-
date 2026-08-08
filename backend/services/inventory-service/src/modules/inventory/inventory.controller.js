import InventoryServices from "./inventory.services.js";
import ResponseUtil from "../../utils/response.js";
import inventoryServices from "./inventory.services.js";

class InventoryController {
  async getAllInventory(req, res, next) {
    try {
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

  async createInventory(req, res, next) {
    try {
      const result = await InventoryServices.createInventory(req.body);

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
      const result = await InventoryServices.updateInventory(
        req.params.id,
        req.body,
      );

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

  async deleteInventory(req, res, next) {
    try {
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
