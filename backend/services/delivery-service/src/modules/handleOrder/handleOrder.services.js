import DeliveryAssignmentRepository from "../repository/deliveryAssignment.repository.js";
import DeliveryAssignmentHistoryRepository from "../repository/deliveryAssignmentHistory.repository.js"
import DeliveryPartnerRepository from "../repository/deliveryPartner.repository.js";
import DeliverySlotRepository from "../repository/deliverySlot.repository.js";
import deliveryPartnerServices from "../deliveryPartner/deliveryPartner.services.js";
import {calculateDistance} from "../../helper.js";
import AppError from "../../utils/AppError.js";
import { env } from "../../config/env.js";
import { Op } from "sequelize";
import initializeModels from "../../models/index.js";


class HandleOrderService {
  async assignOrder(data, user) {
    
    const orderResponse=await fetch(`${env.ORDER_SERVICE_URL}/${data.order_id}`);
    if(!orderResponse.ok){
        throw new AppError("order not found",404)
    }
    const warehouseResponse=await fetch(`${env.INVENTORY_SERVICE_WAREHOUSE_URL}/${data.warehouse_id}`)
      if(!warehouseResponse.ok){
        throw new AppError("warehose not found",404)
      }
    const slot = await DeliverySlotRepository.getDeliverySlotById(data.delivery_slot_id);
    if (!slot) {
      throw new AppError("Delivery slot not found", 404);
    }


    const existingAssignment = await DeliveryAssignmentRepository.getDeliveryAssignmentByOrderId(order_id);
    if (existingAssignment) {
      throw new AppError("Order already assigned", 409);
    }
try{
const db = initializeModels();
const transaction=db.sequelize.transaction()
    const assignment = await DeliveryAssignmentRepository.createDeliveryAssignment({
      order_id:data.order_id,
      delivery_partner_id:data.delivery_partner_id,
      delivery_slot_id:data.delivery_slot_id,
      warehouse_id:data.warehouse_id,
pickup_name:warehouse.data.name,
pickup_address:warehouse.data.address,
pickup_latitude:warehouse.data.lattitude,
pickup_longitude:warehouse.data.longitude,
pickup_contact_name:warehouse.data.contact_person,
pickup_contact_phone:warehouse.data.contact_phone,
customer_name:order.data.address.full_name,
customer_phone:order.data.address.phone,
delivery_address:order.data.address.address_line_1,
delivery_latitude:order.data.address.latitude,
delivery_longitude:order.data.address.longitude,

      assignment_source: data.assignment_source,
      assigned_by: user?.user_id ?? null,
      assigned_at: new Date(),
      
    },transaction);
    //create logs
    await DeliveryAssignmentHistoryRepository.createAssignmentHistory({
      order_id:data.order_id,
      assignment_id:assignment.id,
      action:"ASSIGNED",
    },transaction)
       await transaction.commit();

    return assignment;
  }
    catch(error){
        await transaction.rollback();
      throw new AppError(error.message,error.statusCode)
    }
  }
  async reAssignOrder(data,user,assignmentId){
    //check assingment exist or not 
    const assignment= DeliveryAssignmentRepository.findById(assignmentId);
    if(!assignment){
      throw new AppError("Assignment not found",404);
    }

    const order= await fetch(`${ORDER_SERVICE_URL}/${assignment.order_id}`)
    if(!order.data.status==="ASSIGNED"){
    throw new AppError("order is not eligible for re-assign");
    }
    //check new partner exist and have capablity to accept the order
    const deliveryPartner=DeliveryPartnerRepository.findOne({
      id:data.new_delivery_partner_id,
      status:"ACTIVE",
        current_active_orders: {
                  [Op.lt]: Sequelize.col("max_active_orders")
              }
    })
    if(!deliveryPartner){
      throw new AppError("delivery partner is not capable of accepting order")
    }
    try{
const db=await initializeModels()
const transaction=db.sequelize.transaction()
    // update old assignment
    const oldAssignment=await DeliveryAssignmentRepository.updateById({status:"TRANSFERRED"},{assignmentId,transaction})
    const {id,created_at,updated_at,...newAssignmentdata}=assignment;
    newAssignmentdata.delivery_partner_id=data.new_delivery_partner_id;
//inform order service for new assignment
    const newAssignment= await DeliveryAssignmentRepository.createDeliveryAssignment(newAssignmentdata,{transaction} );
    //create assignmnet log
    await DeliveryAssignmentHistoryRepository.createAssignmentHistory({
      order_id:assignment.order_id,
      assignment_id:newAssignment.id,
      action:"REASSIGNED",
      old_delivery_partner_id:assignment.delivery_partner_id,
      new_delivery_partner_id:data.new_delivery_partner_id,
      reason:data.reason,
      changed_by:user.user_id,
      changed_at:new Date(),
    },{transaction})
    await transaction.commit()
    // inform new rider 
  }catch(error){
   await transaction.rollback()
   throw new AppError(error.message,error.statusCode)
  }


  }
}

export default new HandleOrderService();
