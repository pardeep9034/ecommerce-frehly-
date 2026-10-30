import HandleOrderService from "./handleOrder.service.js";
import ResponseUtil from "../../utils/response.js";

class HandleOrderController {
  async assignOrder(req, res, next) {
    try {
      const result = await HandleOrderService.assignOrder(req.body, req.user, req.headers.authorization);
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
      const result=await HandleOrderService.getAssignmentByOrder(orderId, req.user);
      return ResponseUtil.success(res,result,"assignment fetched")
    }
    catch(error){
      next(error)
    }
  }

  async listReturnsDue(req, res, next) {
    try {
      const result = await HandleOrderService.listReturnsDue(req.user);
      return ResponseUtil.success(res, result, "Returns due fetched");
    } catch (error) {
      next(error);
    }
  }

  async assignPickup(req, res, next) {
    try {
      const result = await HandleOrderService.assignPickup(req.body, req.user, req.headers.authorization);
      return ResponseUtil.success(res, result, "Rider sent to collect the return", 201);
    } catch (error) {
      next(error);
    }
  }

  async receiveReturn(req, res, next) {
    try {
      const result = await HandleOrderService.receiveReturn(req.params.assignmentId, req.body, req.user);
      return ResponseUtil.success(res, result, "Goods taken back");
    } catch (error) {
      next(error);
    }
  }

  // The bytes, read with the caller's bearer token (the client shows them as a blob URL).
  async getDoorPhoto(req, res, next) {
    try {
      const { bytes, mime } = await HandleOrderService.getDoorPhoto(req.params.assignmentId, req.user);
      res.set({ "Content-Type": mime, "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" });
      return res.send(bytes);
    } catch (error) {
      next(error);
    }
  }
}

export default new HandleOrderController();
