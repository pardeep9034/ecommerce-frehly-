import productAttributeService from "./productAttribute.service.js"
import ResponseUtil from "../../utils/response.js";
class productAttributeController{
    async getAllProductAttributes(req,res,next){
        try{
      const page=parseInt(req.query.page)||1;
      const limit=parseInt(req.query.limit)||10;
      const offset=(page-1)*limit;
        const result=await productAttributeService.getAllProductAttributes({limit,offset});
        return ResponseUtil.success(res, result);
        }catch(error){
            next(error);
        }
    }
    async createProductAttributes(req,res,next){
        try{
            const result=await productAttributeService.createProductAttributes(req.body);
            return ResponseUtil.success(res,result);

        }
        catch(error){
            next(error);
        }
    }
    async updateProductAttributes(req,res,next){
        try{
            const id = req.params.id;
            const updateData = req.body;
            const result = await productAttributeService.updateProductAttributes(id, updateData);
            return ResponseUtil.success(res, result);
        }
        catch(error){
            next(error);
        }
    }
    async deleteProductAttributes(req,res,next){
        try{
            const id = req.params.id;
            const result = await productAttributeService.deleteProductAttributes(id);
            return ResponseUtil.success(res, result);
        }
        catch(error){
            next(error);
        }
    }
    async getProductAttributesById(req,res,next){
        try{
            const id = req.params.id;
            const result = await productAttributeService.getProductAttributesById(id);
            return ResponseUtil.success(res, result);
        }
        catch(error){
            next(error);
        }
    }
    async  getProductAttributesByProductId(req,res,next){
        try{
            const productId=req.params.id;
            const result =await productAttributeService.getAttributeByProductId(productId)
return ResponseUtil.success(res,result,"attributes fetched successfully",200)
        }
        catch(error){
next(error)
        }
    }
   
}
export default new productAttributeController();