import InventoryServices from "./inventory.services.js";
import ResponseUtil from "../../utils/response.js";

const InventoryController = {
  async getAllInventory(req, res,next) {
    try{
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await InventoryServices.getAllInventory(limit, offset);
    return ResponseUtil.success(res, result,"Inventory fetched successfully");
    }
    catch(error){
      next(error)
    }
  },
  
  async getInventoryById(req, res) {
    const result = await InventoryServices.getInventoryById(req.params.id);
    if(result.success) {
      return ResponseUtil.success(res, result.data, result.message);
    } else {
      return ResponseUtil.error(res, result.message);
    }
  },

  async getInventoryByProductId(req, res) {
    const { productId } = req.params;
    const { variantId } = req.query;
    
    const result = await InventoryServices.getInventoryByProductId(productId, variantId);
    if(result.success) {
      return ResponseUtil.success(res, result.data, result.message);
    } else {
      return ResponseUtil.error(res, result.message);
    }
  },
  async getInventoryByVariantId(req, res) {
    const { variantId } = req.params;
    const result = await InventoryServices.getInventoryByVariantId(variantId);
    if(result.success) {
      return ResponseUtil.success(res, result.data, result.message);
    } else {
      return ResponseUtil.error(res, result.message);
    }
  },

  async createInventory(req, res) {
    const result = await InventoryServices.createInventory(req.body);
    if(result.success) {
      return ResponseUtil.success(res, result.data, result.message, 201);
    } else {
      return ResponseUtil.error(res, result.message);
    }
  },
  
  async updateInventory(req, res) {
    const result = await InventoryServices.updateInventory(req.params.id, req.body);
    if(result.success) {
      return ResponseUtil.success(res, result.data, result.message);
    } else {
      return ResponseUtil.error(res, result.message);
    }
  },

  async deleteInventory(req, res) {
    const result = await InventoryServices.deleteInventory(req.params.id);
    if(result.success) {
      return ResponseUtil.success(res, result.data, result.message);
    } else {
      return ResponseUtil.error(res, result.message);
    }
  }
};

export default InventoryController;
