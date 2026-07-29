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
  async handOver(req,res,next){
    try{
      const assignmentId=req.params.assignmentId;
      const user=req.user;
      const result=await HandleOrderService.handOver(req.body,assignmentId,user);
      return ResponseUtil.success(res,result,"order re-assigned succesfuly");


    }
    catch{
next(error)
    }
  }
  async confirmHandover(req,res,next){
    try{
      const id=req.params.id;
    const result=await HandleOrderService.confirmHandover(id,req.body)
    return ResponseUtil.success(res,result,"handover initiated ")
    }
    catch(error){
      next(error)
    }
  }
  async confirmReciept(req,res,next){
    try{
      const id=req.params.id;
      const user=req.user;
      const result=await HandleOrderService.confirmReciept(id,req.body,user,req.header.authorization)
      return ResponseUtil.success(res,result,"handover completed succesfuly")

    }catch(error){
      next(error)
    }
  }
  async updateStatus(req,res,next){
    try{
      const id=req.assignmentId;
      const user=req.user;
      const result= await HandleOrderService.updateStatus(id,req.body,user,req.header.authorization)
      return ResponseUtil.success(res,result,"assignment updated succesfuly")

    }
    catch(error){
      next(error)
    }
  }
}

export default new HandleOrderController();
