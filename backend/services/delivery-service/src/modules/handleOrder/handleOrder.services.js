import DeliveryAssignmentRepository from "../repository/deliveryAssignment.repository.js";
import DeliveryAssignmentHistoryRepository from "../repository/deliveryAssignmentHistory.repository.js";
import DeliveryPartnerRepository from "../repository/deliveryPartner.repository.js";
import DeliverySlotRepository from "../repository/deliverySlot.repository.js";
import DeliveryHandoverRepository from "../repository/deliveryHandover.repository.js";
import deliveryPartnerServices from "../deliveryPartner/deliveryPartner.services.js";
import { calculateDistance } from "../../utils/helper.js";
import AppError from "../../utils/AppError.js";
import { env } from "../../config/env.js";
import { Op } from "sequelize";
import initializeModels from "../../models/index.js";

class HandleOrderService {
  async assignOrder(data, user) {
    const [orderResponse, warehouseResponse, slot] = await Promise.all([
      fetch(`${env.ORDER_SERVICE_URL}/${data.order_id}`),
      fetch(`${env.INVENTORY_SERVICE_WAREHOUSE_URL}/${data.warehouse_id}`),
      DeliverySlotRepository.getDeliverySlotById(data.delivery_slot_id),
    ]);
    // const orderResponse=await fetch(`${env.ORDER_SERVICE_URL}/${data.order_id}`);

    const order = await orderResponse.json();
    if (!order.success) {
      throw new AppError("order not found", 404);
    }
    // const warehouseResponse=await fetch(`${env.INVENTORY_SERVICE_WAREHOUSE_URL}/${data.warehouse_id}`)
    if (!warehouseResponse.ok) {
      throw new AppError("warehose not found", 404);
    }
    const warehouse = await warehouseResponse.json();
    // const slot = await DeliverySlotRepository.getDeliverySlotById(data.delivery_slot_id);
    if (!slot) {
      throw new AppError("Delivery slot not found", 404);
    }

    const existingAssignment =
      await DeliveryAssignmentRepository.getDeliveryAssignmentByOrderId(
        data.order_id,
      );
    if (existingAssignment) {
      throw new AppError("Order already assigned", 409);
    }
    const deliveryPartner =await DeliveryPartnerRepository.findOne({
      id: delivery_partner_id,
      status: "ACTIVE",
      current_active_orders: {
        [Op.lt]: Sequelize.col("max_active_orders"),
      },
    });
    if (!deliveryPartner) {
      throw new AppError("delivery partner is not available");
    }

    const db = initializeModels();
    const transaction = db.sequelize.transaction();
    try {
      const assignment =
        await DeliveryAssignmentRepository.createDeliveryAssignment(
          {
            order_id: data.order_id,
            delivery_partner_id: data.delivery_partner_id,
            delivery_slot_id: data.delivery_slot_id,
            warehouse_id: data.warehouse_id,
            pickup_name: warehouse.data.name,
            pickup_address: warehouse.data.address,
            pickup_latitude: warehouse.data.lattitude,
            pickup_longitude: warehouse.data.longitude,
            pickup_contact_name: warehouse.data.contact_person,
            pickup_contact_phone: warehouse.data.contact_phone,
            customer_name: order.data.address.full_name,
            customer_phone: order.data.address.phone,
            delivery_address: order.data.address.address_line_1,
            delivery_latitude: order.data.address.latitude,
            delivery_longitude: order.data.address.longitude,

            assignment_source: data.assignment_source,
            assigned_by: user?.user_id ?? null,
            assigned_at: new Date(),
          },
          transaction,
        );
      //create logs
      await DeliveryAssignmentHistoryRepository.createAssignmentHistory(
        {
          order_id: data.order_id,
          assignment_id: assignment.id,
          action: "ASSIGNED",
        },
        transaction,
      );
      await transaction.commit();

      return assignment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  async reAssignOrder(data, user, assignmentId) {
    //check assingment exist or not
    const assignment = await DeliveryAssignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new AppError("Assignment not found", 404);
    }

    const orderResponse = await fetch(
      `${ORDER_SERVICE_URL}/${assignment.order_id}`,
    );
    if (!orderResponse.ok) {
    throw new AppError("Order Service unavailable",500);
}
    const order = await orderResponse.json();
    if(!order.succses){
      throw new ("order not found",404)
    }
    if (order.data.status !== "ASSIGNED") {
      throw new AppError("order is not eligible for re-assign");
    }
    //check new partner exist and have capablity to accept the order
    const deliveryPartner = await DeliveryPartnerRepository.findOne({
      id: data.new_delivery_partner_id,
      status: "ACTIVE",
      current_active_orders: {
        [Op.lt]: Sequelize.col("max_active_orders"),
      },
    });
    if (!deliveryPartner) {
      throw new AppError("delivery partner is not capable of accepting order");
    }
     const db = await initializeModels();
      const transaction = db.sequelize.transaction();
    try {
     
      // update old assignment
      const oldAssignment = await DeliveryAssignmentRepository.updateById(
        { status: "TRANSFERRED" },
        { assignmentId, transaction },
      );
      const { id, created_at, updated_at, ...newAssignmentdata } = assignment;
      newAssignmentdata.delivery_partner_id = data.new_delivery_partner_id;
      
      const newAssignment =
        await DeliveryAssignmentRepository.createDeliveryAssignment(
          newAssignmentdata,
          { transaction },
        );
        
      

      //create assignmnet log
      await DeliveryAssignmentHistoryRepository.createAssignmentHistory(
        {
          order_id: assignment.order_id,
          assignment_id: newAssignment.id,
          action: "REASSIGNED",
          old_delivery_partner_id: assignment.delivery_partner_id,
          new_delivery_partner_id: data.new_delivery_partner_id,
          reason: data.reason,
          changed_by: user.user_id,
          changed_at: new Date(),
        },
        { transaction },
      );
      await transaction.commit();
      // inform new rider
      return  newAssignment;
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, error.statusCode);
    }
  }
  async handOver(data, assignmentId, user) {
    //check assingment exist or not
    const assignment =  await DeliveryAssignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new AppError("Assignment not found", 404);
    }

    const orderResponse = await fetch(`${ORDER_SERVICE_URL}/${assignment.order_id}`);
    if (!orderResponse.ok) {
      throw new AppError("order not found", 404);
    }
    const order=await orderResponse.json()
    if(!order.success){
throw new AppError("order is not found",404)
    }
    if (order.data.status !== "PICKED_UP") {
      throw new AppError("order is not eligible for handover");
    }
    const deliveryPartner = await  DeliveryPartnerRepository.findOne({
      id: data.new_delivery_partner_id,
      status: "ACTIVE",
      current_active_orders: {
        [Op.lt]: Sequelize.col("max_active_orders"),
      },
    });
    if (!deliveryPartner) {
      throw new AppError("delivery partner is not capable of accepting order");
    }
    if (
    assignment.delivery_partner_id === data.new_delivery_partner_id
) {
    throw new AppError(
        "Cannot hand over to the same delivery partner",
        400
    );
}
    const db = await initializeModels();
    const transaction = await db.sequelize.transaction();
    try {
      //create handover

      const handoverInfo = {
        assignment_id: assignmentId,
        order_id: data.order_id,
        old_delivery_partner_id: assignment.delivery_partner_id,
        new_delivery_partner_id: data.new_delivery_partner_id,
        reason: data.reason,
        handover_latitude: data.handover_latitude,
        handover_longitude: data.handover_longitude,
        status: "PENDING",
      };
      const handover = await DeliveryHandoverRepository.createDeliveryHandover(
        handoverInfo,
        { transaction },
      );
      //inform order service for update order status
      //notify old and new delivery partners
      await transaction.commit();
      return handover;
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, error.statusCode);
    }
  }
  async confirmHandover(handoverId, data) {
    //check handover exist or not
    const handover = await DeliveryHandoverRepository.findById(handoverId);
    if (!handover) {
      throw new AppError("handover not found", 404);
    }
     const db = await initializeModels();
      const transaction = db.sequelize.transaction();
    try {
     
      const updatedHandover = await DeliveryHandoverRepository.updateById(
        handoverId,
        {
          old_partner_confirmed_at: new Date(),
          status: "OLD_PARTNER_CONFIRMED",
          handover_latitude: data.handover_latitude,
          handover_longitude: data.handover_longitude,
        },
        { transaction },
      );
      await transaction.commit();
      return updatedHandover;
    } catch (error) {
      await transaction.rollback();
    throw new AppError(error.message, error.statusCode);
    }
  }
  async confirmReciept(handoverId, data, user, authorizationHeader) {
    const handover = await DeliveryHandoverRepository.findById(handoverId);
    if (!handover) {
      throw new AppError("handover not found", 404);
    }
    try {
      const db = await initializeModels();
      const transaction = db.sequelize.transaction();
      const updatedHandover = await DeliveryHandoverRepository.updateById(
        handoverId,
        {
          status: data.status,
        },
        { transaction },
      );

      const assignment = await DeliveryAssignmentRepository.updateById(
        handover.assignment_id,
        { status: "TRANSFERRED" },
        { transaction },
      );
      const newAssignment = await DeliveryAssignmentRepository.create({
        order_id: assignment.order_id,
        warehouse_id: assignment.warehouse_id,
        delivery_partner_id: handover.new_delivery_partner_id,
        delivery_slot_id: assignment.delivery_slot_id,
        assignment_source: "MANUAL",
        assigned_by: user.user_id,
        assigned_at: new Date(),
        pickup_latitude: handover.handover_latitude,
        pickup_longitude: handover.handover_longitude,
        customer_name: assignment.customer_name,
        customer_phone: assignment.customer_phone,
        delivery_address: assignment.delivery_address,
        delivery_latitude: assignment.delivery_latitude,
        delivery_longitude: assignment.delivery_longitude,
        status: "ACTIVE",
      });
      const updatedOrder = await fetch(
        `${env.ORDER_SERVICE_URL}/${assignment.order_id}/status`,
        {
          method: "post",
          headers: {
            Authorization: authorizationHeader,
            "content-type": "application/json",
          },
          body: {
            status: "OUT_FOR_DELIVERY",
          },
        },
      );
      //create Assignment history
      const AssignmentHistory =
        DeliveryAssignmentHistoryRepository.createAssignmentHistory({
          order_id: assignment.order_id,
          assignment_id: assignment.id,
          action: "REASSIGNED",
          old_delivery_partner_id: handover.old_delivery_partner_id,
          new_delivery_partner_id: handover.new_delivery_partner_id,
          reason: data.reason,
          changed_by: user.user_id,
          changed_at: new Date(),
        });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw (error.message, error.statusCode);
    }
  }
  async updateStatus(assignmentId, data, user, authorizationHeader) {
    //check assignmet exist or not
    const assignment = DeliveryAssignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new AppError("Assignment not found", 404);
    }
    const orderResponse = await fetch(
      `${env.ORDER_SERVICE_URL}/${assignmentId}`,
    );
    if (!orderResponse.ok) {
      throw new AppError("order is not found");
    }
    // update assignment
    const db = initializeModels();
    const transaction = db.sequelize.transaction();
    try {
      const updateAssignment = DeliveryAssignmentRepository.updateById(
        assignmentId,
        data.status,
        { transaction },
      );
      // create history
      const assignmentHistory = DeliveryAssignmentHistoryRepository.create({
        order_id: assignment.order_id,
        assignment_id: assignment.id,
        action: data.status,
        old_delivery_partner_id: assignment.old_delivery_partner_id,
      });
      // inform order or update order
      const updatedOrder = await fetch(
        `${env.ORDER_SERVICE_URL}/${assignment.order_id}/status`,
        {
          method: "post",
          headers: {
            AuthAuthorization: authorizationHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: data.status }),
        },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, error.statusCode);
    }
  }
}

export default new HandleOrderService();
