import BrandServices from "./brand.services.js";
import ResponseUtil from "../../utils/response.js"
class brandController{
    async createBrand(req,res,next){
        try{
            const result=await BrandServices.createBrand(req.body);
            return ResponseUtil.success(res,result,"Brand created successfully");
        }
        catch(error){
            next(error);
        }
    }
    async getAllBrands(req,res,next){
        try{
            const page=parseInt(req.query.page)|| 1;
            const limit=parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const result=await BrandServices.getAllBrands({offset,limit});
            return ResponseUtil.success(res,result,"Brands fetched successfully");
        }
        catch(error){
            next(error);
        }
    }
    async updateBrand(req,res,next){
        try{
        const {id}=req.params;
        const updateData=req.body;
        const result=await BrandServices.updateBrand(id,updateData);
        return ResponseUtil.success(res,result,"Brand updated successfully");
        }catch(error){
            next(error);
        }
    }
    async deleteBrand(req,res,next){
        try{
        const {id}=req.params;
        const result=await BrandServices.deleteBrand(id);
        return ResponseUtil.success(res,result,"Brand deleted successfully");
        }catch(error){
            next(error);
        }
    }
    async getBrandById(req,res,next){
        try{
            const {id}=req.params;
            const result=await BrandServices.getBrandById(id);
            return ResponseUtil.success(res,result,"Brand fetched successfully");

        }catch(error){
            next (error);
        }
    }
}
export default new brandController();