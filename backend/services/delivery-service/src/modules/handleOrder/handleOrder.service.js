import jwt from "jsonwebtoken";
import DeliveryAssignmentRepository from "../repository/deliveryAssignment.repository.js";
import DeliveryAssignmentHistoryRepository from "../repository/deliveryAssignmentHistory.repository.js";
import DeliveryStatusHistoryRepository from "../repository/deliveryStatusHistory.repository.js";
import DeliveryAttemptRepository from "../repository/deliveryAttempt.repository.js";
import DeliveryPartnerRepository from "../repository/deliveryPartner.repository.js";
import DeliverySlotRepository from "../repository/deliverySlot.repository.js";
import DeliveryHandoverRepository, { OPEN_HANDOVER } from "../repository/deliveryHandover.repository.js";
import deliveryPartnerServices from "../deliveryPartner/deliveryPartner.service.js";
import { calculateDistance } from "../../utils/helper.js";
import AppError from "../../utils/AppError.js";
import { env } from "../../config/env.js";
import { Op, Sequelize } from "sequelize";
import initializeModels from "../../models/index.js";
import logger from "../../utils/Logger.js";
import { publishEvent } from "../../utils/notificationClient.js";
import { MAX_DELIVERY_ATTEMPTS } from "../../constants/deliveryFailure.js";

// DeliveryAssignment.status is a narrow lifecycle enum
// (ACTIVE/TRANSFERRED/COMPLETED/CANCELLED/FAILED) — it doesn't share the
// order's PICKED_UP/OUT_FOR_DELIVERY vocabulary, so it (and the assigned
// partner's active-order count) should only change once the order reaches
// one of these terminal states.
const TERMINAL_ASSIGNMENT_STATUS = {
  DELIVERED: "COMPLETED",
  DELIVERY_FAILED: "FAILED"
};
const TERMINAL_HISTORY_ACTION = {
  DELIVERED: "COMPLETED",
  DELIVERY_FAILED: "CANCELLED"
};

class HandleOrderService {
  async assignOrder(data, user, authorization) {
    // A failed drop ends its assignment, so the order can be assigned again, up to MAX_DELIVERY_ATTEMPTS failures.
    const existingAssignment =
      await DeliveryAssignmentRepository.getDeliveryAssignmentByOrderId(
        data.order_id,
      );
    if (existingAssignment && existingAssignment.status !== "FAILED") {
      throw new AppError("Order already assigned", 409);
    }
    const failedAttempts = (await DeliveryAttemptRepository.getAttemptsByOrderId(data.order_id)).length;
    if (failedAttempts >= MAX_DELIVERY_ATTEMPTS) {
      throw new AppError(`Delivery failed ${failedAttempts} times; cancel or return this order instead`, 409);
    }

    const [orderResponse, warehouseResponse, slot] = await Promise.all([
      fetch(`${env.ORDER_SERVICE_URL}/${data.order_id}`, { headers: { Authorization: authorization } }),
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

    const deliveryPartner =await DeliveryPartnerRepository.findOne({
      id: data.delivery_partner_id,
      status: "ACTIVE",
      is_online: true,
      current_active_orders: {
        [Op.lt]: Sequelize.col("max_active_orders"),
      },
    });
    if (!deliveryPartner) {
      throw new AppError("delivery partner is not available");
    }

    const db = await initializeModels();
    const transaction = await db.sequelize.transaction();
    try {
      const assignment =
        await DeliveryAssignmentRepository.createDeliveryAssignment(
          {
            order_id: data.order_id,
            delivery_partner_id: data.delivery_partner_id,
            delivery_slot_id: data.delivery_slot_id,
            warehouse_id: data.warehouse_id,
            zone_id: warehouse.data.zone_id,
            pickup_name: warehouse.data.name,
            pickup_address: warehouse.data.address,
            pickup_latitude: warehouse.data.latitude,
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
          { transaction },
        );
      //create logs
      await DeliveryAssignmentHistoryRepository.createAssignmentHistory(
        {
          order_id: data.order_id,
          assignment_id: assignment.id,
          action: "ASSIGNED",
        },
        { transaction },
      );
      // The delivery timeline starts here; the partner app reads an assignment's current step from its latest row.
      await DeliveryStatusHistoryRepository.createStatusHistory(
        { order_id: data.order_id, delivery_partner_id: data.delivery_partner_id, status: "ASSIGNED" },
        { transaction },
      );

      const statusResponse = await fetch(`${env.ORDER_SERVICE_URL}/${data.order_id}/status`, {
        method: "PATCH",
        headers: { Authorization: authorization, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ASSIGNED" })
      });
      if (!statusResponse.ok) {
        throw new AppError("Failed to update order status to ASSIGNED", statusResponse.status || 500);
      }

      await DeliveryPartnerRepository.updateDeliveryPartner(
        data.delivery_partner_id,
        { current_active_orders: Sequelize.literal("current_active_orders + 1") },
        { transaction }
      );

      await transaction.commit();

      this.scheduleAutoProgression(assignment.id);

      return assignment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // No delivery-partner app exists to trigger these for real, so once an
  // order is manually assigned, simulate the rest of the timeline on a
  // timer instead of requiring more manual status calls.
  // ponytail: in-memory timers don't survive a process restart — an order
  // mid-chain would freeze if this service redeploys. Acceptable for this
  // stage; a periodic sweep over stale assignments is the upgrade path if
  // that starts to matter.
  // Pending timers per assignment. A real status update (a partner's or staff's) cancels the rest, so a stale timer can
  // never overwrite it with a simulated step; updateStatus does that for every caller that passes a user.
  autoProgressionTimers = new Map();

  scheduleAutoProgression(assignmentId) {
    const steps = [
      { status: "PICKED_UP", delay: env.AUTO_PROGRESS_PICKUP_MS },
      { status: "OUT_FOR_DELIVERY", delay: env.AUTO_PROGRESS_TRANSIT_MS },
      { status: "DELIVERED", delay: env.AUTO_PROGRESS_DELIVERED_MS }
    ];

    let cumulativeDelay = 0;
    const timers = [];
    this.autoProgressionTimers.set(assignmentId, timers);

    for (const step of steps) {
      cumulativeDelay += step.delay;

      timers.push(setTimeout(async () => {
        try {
          await this.updateStatus(assignmentId, { status: step.status }, null, this.buildSystemAuthorization());
        } catch (error) {
          logger.error(`Auto-progression to ${step.status} failed for assignment ${assignmentId}: ${error.message}`);
        }
        if (step.status === "DELIVERED") this.autoProgressionTimers.delete(assignmentId);
      }, cumulativeDelay));
    }
  }

  cancelAutoProgression(assignmentId) {
    for (const timer of this.autoProgressionTimers.get(assignmentId) ?? []) clearTimeout(timer);
    this.autoProgressionTimers.delete(assignmentId);
  }

  // A timer callback has no caller's JWT to forward — mint a short-lived
  // internal one instead. Every service verifies against the same shared
  // JWT_SECRET, so order-service accepts this exactly like a real token
  // (mirrors order-service's own buildSystemAuthorization()).
  buildSystemAuthorization() {
    const token = jwt.sign({ user_id: "system", role: "SYSTEM" }, env.JWT_SECRET, { expiresIn: "1h" });
    return `Bearer ${token}`;
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
      is_online: true,
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
      if (error instanceof AppError) throw error;
      throw new AppError(error.message, 500);
    }
  }
  // `partner` is the caller's row when a DELIVERY_PARTNER is calling (staff pass nothing). A partner only acts on their own
  // open work, and their calls reach the order service as SYSTEM: its role list has no DELIVERY_PARTNER.
  async handOver(data, assignmentId, user, authorizationHeader, partner) {
    const assignment =  await DeliveryAssignmentRepository.findById(assignmentId);
    if (!assignment || (partner && (assignment.delivery_partner_id !== partner.id || assignment.status !== "ACTIVE"))) {
      throw new AppError("Assignment not found", 404);
    }
    const authorization = partner ? this.buildSystemAuthorization() : authorizationHeader;

    const orderResponse = await fetch(`${env.ORDER_SERVICE_URL}/${assignment.order_id}`, { headers: { Authorization: authorization } });
    if (!orderResponse.ok) {
      throw new AppError("order not found", 404);
    }
    const order=await orderResponse.json()
    if(!order.success){
throw new AppError("order is not found",404)
    }
    if (order.data.status !== "PICKED_UP") {
      throw new AppError("order is not eligible for handover", 409);
    }
    const deliveryPartner = await  DeliveryPartnerRepository.findOne({
      id: data.new_delivery_partner_id,
      status: "ACTIVE",
      is_online: true,
      current_active_orders: {
        [Op.lt]: Sequelize.col("max_active_orders"),
      },
    });
    if (!deliveryPartner) {
      throw new AppError("delivery partner is not capable of accepting order", 409);
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
        order_id: assignment.order_id,
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

      const statusResponse = await fetch(`${env.ORDER_SERVICE_URL}/${assignment.order_id}/status`, {
        method: "PATCH",
        headers: { Authorization: authorization, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "HANDOVER_IN_PROGRESS" })
      });
      if (!statusResponse.ok) {
        throw new AppError("Failed to update order status to HANDOVER_IN_PROGRESS", statusResponse.status || 500);
      }
      //notify old and new delivery partners
      await transaction.commit();
      // The order is leaving this partner: a pending simulated step must not move it on underneath the handover.
      this.cancelAutoProgression(assignmentId);
      return handover;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) throw error;
      throw new AppError(error.message, 500);
    }
  }
  // Step 2: the first partner says the order has been passed on (staff can do it for them). Only once: the one conditional
  // UPDATE is the whole transition, so a double tap cannot confirm twice. Coordinates sent at request time are kept unless
  // new ones come with this call.
  async confirmHandover(handoverId, data, partner) {
    const handover = await DeliveryHandoverRepository.findById(handoverId);
    if (!handover || (partner && handover.old_delivery_partner_id !== partner.id)) {
      throw new AppError("handover not found", 404);
    }
    const db = await initializeModels();
    const [moved] = await db.DeliveryHandover.update(
      {
        old_partner_confirmed_at: new Date(),
        status: "OLD_PARTNER_CONFIRMED",
        handover_latitude: data.handover_latitude,
        handover_longitude: data.handover_longitude,
      },
      { where: { id: handoverId, status: "PENDING" } },
    );
    if (!moved) throw new AppError("handover is not waiting for the first partner", 409);
    return DeliveryHandoverRepository.findById(handoverId);
  }
  // Step 3: the second partner has the order. In one transaction: the handover completes, the first assignment is
  // TRANSFERRED, the second partner gets a new one that starts at OUT_FOR_DELIVERY (they are holding the order), and both
  // partners' open counts move. The first UPDATE is the claim: only one confirm of an OLD_PARTNER_CONFIRMED handover wins.
  async confirmReciept(handoverId, data, user, authorizationHeader, partner) {
    const handover = await DeliveryHandoverRepository.findById(handoverId);
    if (!handover || (partner && handover.new_delivery_partner_id !== partner.id)) {
      throw new AppError("handover not found", 404);
    }
    const authorization = partner ? this.buildSystemAuthorization() : authorizationHeader;
    const db = await initializeModels();
    const transaction = await db.sequelize.transaction();
    try {
      const [claimed] = await db.DeliveryHandover.update(
        { status: "COMPLETED", receipt_confirmed_at: new Date() },
        { where: { id: handoverId, status: "OLD_PARTNER_CONFIRMED" }, transaction },
      );
      if (!claimed) throw new AppError("handover is not waiting for the second partner", 409);

      const old = await DeliveryAssignmentRepository.findById(handover.assignment_id, { transaction });
      // Still open? The first partner may have carried on and finished it while the handover sat there.
      const [closed] = await db.DeliveryAssignment.update(
        { status: "TRANSFERRED" },
        { where: { id: old.id, status: "ACTIVE" }, transaction },
      );
      if (!closed) throw new AppError("this delivery is no longer open", 409);

      // Everything about the delivery carries over; only the partner, the source and the pickup point change.
      const { id, created_at, updated_at, ...carried } = old.get({ plain: true });
      const next = await DeliveryAssignmentRepository.create(
        {
          ...carried,
          delivery_partner_id: handover.new_delivery_partner_id,
          assignment_source: "MANUAL",
          assigned_by: user?.user_id ?? null,
          assigned_at: new Date(),
          status: "ACTIVE",
          pickup_latitude: handover.handover_latitude ?? carried.pickup_latitude,
          pickup_longitude: handover.handover_longitude ?? carried.pickup_longitude,
        },
        { transaction },
      );
      // The partner app reads the current step from this timeline; without a row the new partner would start at ASSIGNED.
      await DeliveryStatusHistoryRepository.createStatusHistory(
        { order_id: old.order_id, delivery_partner_id: handover.new_delivery_partner_id, status: "OUT_FOR_DELIVERY", remarks: "Received by handover" },
        { transaction },
      );
      await DeliveryAssignmentHistoryRepository.createAssignmentHistory(
        {
          order_id: old.order_id,
          assignment_id: next.id,
          action: "REASSIGNED",
          old_delivery_partner_id: handover.old_delivery_partner_id,
          new_delivery_partner_id: handover.new_delivery_partner_id,
          reason: data.reason ?? handover.reason,
          changed_by: user?.user_id ?? null,
          changed_at: new Date(),
        },
        { transaction },
      );
      await DeliveryPartnerRepository.updateDeliveryPartner(
        handover.old_delivery_partner_id,
        { current_active_orders: Sequelize.literal("GREATEST(current_active_orders - 1, 0)") },
        { transaction },
      );
      await DeliveryPartnerRepository.updateDeliveryPartner(
        handover.new_delivery_partner_id,
        { current_active_orders: Sequelize.literal("current_active_orders + 1") },
        { transaction },
      );

      const statusResponse = await fetch(`${env.ORDER_SERVICE_URL}/${old.order_id}/status`, {
        method: "PATCH",
        headers: { Authorization: authorization, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OUT_FOR_DELIVERY" }),
      });
      if (!statusResponse.ok) {
        throw new AppError("Failed to update order status to OUT_FOR_DELIVERY", statusResponse.status || 500);
      }
      await transaction.commit();
      return next;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) throw error;
      throw new AppError(error.message, 500);
    }
  }
  // Call it off before the receipt: the receiver declines or the giver withdraws (staff can do either). The order stays
  // with the first partner and goes back to PICKED_UP, their current step. The conditional UPDATE is the claim, so a
  // decline cannot cross a receipt confirmed at the same moment.
  async cancelHandover(handoverId, user, authorizationHeader, partner) {
    const handover = await DeliveryHandoverRepository.findById(handoverId);
    if (!handover || (partner && ![handover.old_delivery_partner_id, handover.new_delivery_partner_id].includes(partner.id))) {
      throw new AppError("handover not found", 404);
    }
    const authorization = partner ? this.buildSystemAuthorization() : authorizationHeader;
    const db = await initializeModels();
    const transaction = await db.sequelize.transaction();
    try {
      const [claimed] = await db.DeliveryHandover.update(
        { status: "CANCELLED", cancelled_at: new Date(), cancelled_by: partner?.id ?? null },
        { where: { id: handoverId, status: OPEN_HANDOVER }, transaction },
      );
      if (!claimed) throw new AppError("handover is already finished", 409);

      const statusResponse = await fetch(`${env.ORDER_SERVICE_URL}/${handover.order_id}/status`, {
        method: "PATCH",
        headers: { Authorization: authorization, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PICKED_UP", remarks: "Handover called off", changed_by: partner ? Number(user.user_id) : undefined }),
      });
      if (!statusResponse.ok) {
        throw new AppError("Failed to update order status to PICKED_UP", statusResponse.status || 500);
      }
      await transaction.commit();
      return DeliveryHandoverRepository.findById(handoverId);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) throw error;
      throw new AppError(error.message, 500);
    }
  }
  // Who is delivering an order, for the admin order page. The newest assignment wins, so a handed-over order shows the
  // partner holding it now. null when the order was never assigned.
  async getAssignmentByOrder(orderId) {
    const assignment = await DeliveryAssignmentRepository.getDeliveryAssignmentByOrderId(orderId);
    if (!assignment) return null;

    // The partner included with the assignment has name and phone hidden (default scope). This route is staff-only, so read them unscoped.
    const partner = await DeliveryPartnerRepository.findWithZone(assignment.delivery_partner_id);
    const slot = assignment.deliverySlot;
    return {
      assignment_id: assignment.id,
      status: assignment.status,
      assigned_at: assignment.assigned_at,
      partner: partner ? { id: partner.id, name: partner.name, phone: partner.phone } : null,
      slot: slot ? { name: slot.name, start_time: slot.start_time, end_time: slot.end_time } : null,
    };
  }

  // `user` is the caller; the auto-progression timers pass null, so only real updates cancel the timers.
  // `data.reason` is the failure reason on DELIVERY_FAILED. `actorId` is who to record on the order for a caller whose
  // own token is not forwarded (the partner app's updates go to the order service as SYSTEM).
  async updateStatus(assignmentId, data, user, authorizationHeader, actorId) {
    if (user) this.cancelAutoProgression(assignmentId);
    //check assignmet exist or not
    const assignment = await DeliveryAssignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new AppError("Assignment not found", 404);
    }
    const orderResponse = await fetch(
      `${env.ORDER_SERVICE_URL}/${assignment.order_id}`,
      { headers: { Authorization: authorizationHeader } },
    );
    if (!orderResponse.ok) {
      throw new AppError("order is not found");
    }
    // update assignment
    const db = await initializeModels();
    const transaction = await db.sequelize.transaction();
    let attemptNumber;
    try {
      const terminalAssignmentStatus = TERMINAL_ASSIGNMENT_STATUS[data.status];

      if (terminalAssignmentStatus) {
        await DeliveryAssignmentRepository.updateById(
          assignmentId,
          { status: terminalAssignmentStatus },
          { transaction },
        );
        await DeliveryPartnerRepository.updateDeliveryPartner(
          assignment.delivery_partner_id,
          { current_active_orders: Sequelize.literal("GREATEST(current_active_orders - 1, 0)") },
          { transaction },
        );
      }

      const historyAction = TERMINAL_HISTORY_ACTION[data.status];

      if (historyAction) {
        await DeliveryAssignmentHistoryRepository.createAssignmentHistory({
          order_id: assignment.order_id,
          assignment_id: assignment.id,
          action: historyAction,
          old_delivery_partner_id: assignment.delivery_partner_id,
        }, { transaction });
      }

      await DeliveryStatusHistoryRepository.createStatusHistory({
        order_id: assignment.order_id,
        delivery_partner_id: assignment.delivery_partner_id,
        status: data.status,
        remarks: data.reason ?? null,
      }, { transaction });

      if (data.status === "DELIVERY_FAILED") {
        const earlier = await DeliveryAttemptRepository.getAttemptsByOrderId(assignment.order_id, { transaction });
        attemptNumber = earlier.length + 1;
        await DeliveryAttemptRepository.createDeliveryAttempt({
          order_id: assignment.order_id,
          delivery_partner_id: assignment.delivery_partner_id,
          attempt_number: attemptNumber,
          failure_reason: data.reason ?? null,
          attempted_at: new Date(),
        }, { transaction });
      }
      // inform order or update order
      const updatedOrder = await fetch(
        `${env.ORDER_SERVICE_URL}/${assignment.order_id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: authorizationHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: data.status, remarks: data.reason, changed_by: actorId }),
        },
      );
      if (!updatedOrder.ok) {
        throw new AppError("Failed to update order status", updatedOrder.status || 500);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) throw error;
      throw new AppError(error.message, 500);
    }

    // Tell the store (the pickup contact on the assignment) so it can reassign or cancel. Best effort, after the commit.
    if (attemptNumber && assignment.pickup_contact_phone) {
      void publishEvent("delivery.attempt.failed", {
        orderId: assignment.order_id,
        phone: assignment.pickup_contact_phone,
        attempt: attemptNumber,
        maxAttempts: MAX_DELIVERY_ATTEMPTS,
        reason: data.reason ?? "no reason given",
      });
    }
  }
}

export default new HandleOrderService();
