import measurementUnitService from "./measurementUnit.service.js";
import ResponseUtil from "../../utils/response.js";
class measurementUnitController{
    async createUnit(req,res,next){
        try {
            const result=await measurementUnitService.createUnit(req.body);
            return ResponseUtil.success(res, result);
        } catch (error) {
            next(error);
        }
    }
    async getAllUnits(req,res,next){
        try {
            const page=parseInt(req.query.page)||1;
            const limit=parseInt(req.query.limit)||10;
            const result=await measurementUnitService.getAllUnits({page,limit});
            return ResponseUtil.success(res, result);
        } catch (error) {
            next(error);
        }
    }
    async getUnitById(req,res,next){
        try {
            const result=await measurementUnitService.getUnitById(req.params.id);
            return ResponseUtil.success(res, result);
        } catch (error) {
            next(error);
        }
    }
    async updateUnit(req,res,next){
        try {
            const result=await measurementUnitService.updateUnit(req.params.id,req.body);
            return ResponseUtil.success(res, result);
        } catch (error) {
            next(error);
        }
    }
    async deleteUnit(req,res,next){
        try {
            const result=await measurementUnitService.deleteUnit(req.params.id);
            return ResponseUtil.success(res, result);
        } catch (error) {
            next(error);
        }
    }

}
export default new measurementUnitController();