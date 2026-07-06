import VariantServices from "./variant.services.js";
import ResponseUtil from "../../utils/response.js";
import AppError from "../../utils/AppError.js";

const VariantController = {
  async searchVariants(req, res,next) {
    try{
    const { search } = req.query;
    const result = await VariantServices.searchVariantsByProductName(search);
   
      return ResponseUtil.success(res, result, "Variants fetched successfully");
    }
    catch(error){
      next(error);
    }
  },

  async getAllVariants(req, res,next) {
    try{
    const { productId } = req.params;
    const page=parseInt(req.query.page)||1;
    const limit=parseInt(req.query.limit)||10;
    const offset=(page-1)*limit;
    const result = await VariantServices.getAllVariants(productId,offset,limit);
    return ResponseUtil.success(res, result, "variants fectched successfully",200);
    }
    catch(error){
      next(error);
    }
  },

  async getVariantById(req, res,next) {
    try{
    const result = await VariantServices.getVariantById(req.params.id);
   
      return ResponseUtil.success(res, result,"variant fectched successfully",200);
    }catch(error){
next(error);
    }
  },

  async createVariant(req, res,next) {
    try{
    const { productId } = req.params;
    const result = await VariantServices.createVariant(productId, req.body);
 
      return ResponseUtil.success(res, result, "variant created successfully ", 201);
    }catch(error){
      next(error);
    }
  },

  async updateVariant(req, res,next) {
    try{
    const result = await VariantServices.updateVariant(req.params.id, req.body);
   
      return ResponseUtil.success(res, result, "variant updated successfully ",200);
   }catch(error){
      next(error);
    }
  },

  async deleteVariant(req, res,next) {
    try{
    const result = await VariantServices.deleteVariant(req.params.id);
    return ResponseUtil.success(res, result, "variant deleted successfully",200);
   }
    catch(error){
      next(error)
    }
  }
};

export default VariantController;
