import HandleOrderService from "./handleOrder.services.js";
import ResponseUtil from "../../utils/response.js";

class HandleOrderController {
  async assignOrder(req, res, next) {
    try {
        
    
      const result = await HandleOrderService.assignOrder(req.body, req.user);
      return ResponseUtil.success(res, result, "Order assigned successfully", 201);
    } catch (error) {
      return next(error);
    }
  }
  async reAssignOrder(req,res,next){
    try{
      const assignmentId=req.params.assignmentId
      const result = await HandleOrderService.reAssignOrder(req.body,req.user,assignmentId);
      return ResponseUtil.success(res,result,"order  re-assigned succesfully ")

    }catch(error){
      next(error)
    }
  }
}

export default new HandleOrderController();
