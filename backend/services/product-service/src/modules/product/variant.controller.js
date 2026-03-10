import VariantServices from "./variant.services.js";
import ResponseUtil from "../../utils/response.js";

const VariantController = {
  async getAllVariants(req, res) {
    const { productId } = req.params;
    const result = await VariantServices.getAllVariants(productId);
    if (result.success) {
      return ResponseUtil.success(res, result.data, result.message);
    } else {
      return ResponseUtil.error(res, result.message);
    }
  },

  async getVariantById(req, res) {
    const result = await VariantServices.getVariantById(req.params.id);
    if (result.success) {
      return ResponseUtil.success(res, result.data, result.message);
    } else {
      return ResponseUtil.error(res, result.message);
    }
  },

  async createVariant(req, res) {
    const { productId } = req.params;
    const result = await VariantServices.createVariant(productId, req.body);
    if (result.success) {
      return ResponseUtil.success(res, result.data, result.message, 201);
    } else {
      return ResponseUtil.error(res, result.message);
    }
  },

  async updateVariant(req, res) {
    const result = await VariantServices.updateVariant(req.params.id, req.body);
    if (result.success) {
      return ResponseUtil.success(res, result.data, result.message);
    } else {
      return ResponseUtil.error(res, result.message);
    }
  },

  async deleteVariant(req, res) {
    const result = await VariantServices.deleteVariant(req.params.id);
    if (result.success) {
      return ResponseUtil.success(res, result.data, result.message);
    } else {
      return ResponseUtil.error(res, result.message);
    }
  }
};

export default VariantController;
