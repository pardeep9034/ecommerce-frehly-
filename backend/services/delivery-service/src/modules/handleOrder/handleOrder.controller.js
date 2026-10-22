import HandleOrderService from "./handleOrder.service.js";
import ResponseUtil from "../../utils/response.js";

class HandleOrderController {
  async assignOrder(req, res, next) {
    try {
      const warehouse_id = req.headers["x-warehouse-id"];
      const result = await HandleOrderService.assignOrder({ ...req.body, warehouse_id }, req.user, req.headers.authorization);
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
  async handOver(req,res,next){
    try{
      const assignmentId=req.params.assignmentId;
      const user=req.user;
      const result=await HandleOrderService.handOver(req.body,assignmentId,user,req.headers.authorization,req.partner);
      return ResponseUtil.success(res,result,"handover requested",201);


    }
    catch(error){
next(error)
    }
  }
  async confirmHandover(req,res,next){
    try{
      const id=req.params.id;
    const result=await HandleOrderService.confirmHandover(id,req.body,req.partner)
    return ResponseUtil.success(res,result,"handover confirmed by the first partner")
    }
    catch(error){
      next(error)
    }
  }
  async confirmReciept(req,res,next){
    try{
      const id=req.params.id;
      const user=req.user;
      const result=await HandleOrderService.confirmReciept(id,req.body,user,req.headers.authorization,req.partner)
      return ResponseUtil.success(res,result,"handover completed succesfuly")

    }catch(error){
      next(error)
    }
  }
  async cancelHandover(req,res,next){
    try{
      const result=await HandleOrderService.cancelHandover(req.params.id,req.user,req.headers.authorization,req.partner)
      return ResponseUtil.success(res,result,"handover called off")
    }catch(error){
      next(error)
    }
  }
  async updateStatus(req,res,next){
    try{
      const id=req.params.assignmentId;
      const user=req.user;
      const result= await HandleOrderService.updateStatus(id,req.body,user,req.headers.authorization)
      return ResponseUtil.success(res,result,"assignment updated succesfuly")

    }
    catch(error){
      next(error)
    }
  }
  async getAssignmentByOrder(req,res,next){
    try{
      const orderId=Number(req.params.orderId);
      if(!Number.isInteger(orderId)||orderId<=0){
        return ResponseUtil.error(res,"Invalid order ID",400);
      }
      const result=await HandleOrderService.getAssignmentByOrder(orderId);
      return ResponseUtil.success(res,result,"assignment fetched")
    }
    catch(error){
      next(error)
    }
  }
}

export default new HandleOrderController();
