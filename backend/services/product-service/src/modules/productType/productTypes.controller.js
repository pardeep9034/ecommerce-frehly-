import productTypeService from "./productType.service.js";
import ResponseUtil from "../../utils/response.js";
class productTypeController{
    async createProductType(req,res,next){
        try {
            const result=await productTypeService.createProductType(req.body);
            return ResponseUtil.success(res, result);
        } catch (error) {
            next(error);
        }
    }
    async getAllProductTypes(req,res,next){
        try {
            const page=parseInt(req.query.page);
            const limit=parseInt(req.query.limit)
            const result=await productTypeService.getAllProductTypes({page,limit});
            return ResponseUtil.success(res, result);
        } catch (error) {
            next(error);
        }
    }
    async getProductTypeById(req,res,next){
        try {
            const result=await productTypeService.getProductTypeById(req.params.id);
            return ResponseUtil.success(res, result);
        } catch (error) {
            next(error);
        }
    }
    async updateProductType(req,res,next){
        try {
            const result=await productTypeService.updateProductType(req.params.id,req.body);
            return ResponseUtil.success(res, result);
        } catch (error) {
            next(error);
        }
    }
    async deleteProductType(req,res,next){
        try {
            const result=await productTypeService.deleteProductType(req.params.id);
            return ResponseUtil.success(res, result);
        } catch (error) {
            next(error);
        }
    }

}
export default new productTypeController();