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
import { ownStore, assertOwnStore } from "../../utils/ownStore.js";
import { env } from "../../config/env.js";
import { Op, Sequelize } from "sequelize";
import initializeModels from "../../models/index.js";
import logger from "../../utils/Logger.js";
import { publishEvent } from "../../utils/notificationClient.js";
import { FINAL_FAILURES, MAX_DELIVERY_ATTEMPTS, RETURN_OVERDUE_MS } from "../../constants/deliveryFailure.js";
import { pickupCodeMatches } from "../../utils/pickupCode.js";
import { notHoldingReturns, returnKind } from "../../utils/returnHold.js";
import * as storage from "../../utils/storage.js";
import { detectMime } from "../partnerApplication/partnerApplicationRules.js";

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
    // A failed drop ends its assignment, so the order can be assigned again, up to MAX_DELIVERY_ATTEMPTS failures,
    // unless the customer refused it (FINAL_FAILURES): that one goes back to the store to be cancelled.
    const existingAssignment =
      await DeliveryAssignmentRepository.getDeliveryAssignmentByOrderId(
        data.order_id,
      );
    if (existingAssignment && existingAssignment.status !== "FAILED") {
      throw new AppError("Order already assigned", 409);
    }
    const attempts = await DeliveryAttemptRepository.getAttemptsByOrderId(data.order_id);
    if (attempts.length >= MAX_DELIVERY_ATTEMPTS) {
      throw new AppError(`Delivery failed ${attempts.length} times; cancel or return this order instead`, 409);
    }
    if (FINAL_FAILURES.has(attempts[0]?.reason_code)) {
      throw new AppError("The customer refused this order: take it back to the store and cancel it there", 409);
    }

    // Read with the caller's token: order-service 403s store staff on another store's order, which ends here as a 404.
    const orderResponse = await fetch(`${env.ORDER_SERVICE_URL}/${data.order_id}`, { headers: { Authorization: authorization } });
    const order = await orderResponse.json();
    if (!order.success) {
      throw new AppError("order not found", 404);
    }
    // Failed and not back at the store yet: the goods are still with that rider, so only they can try again, and the
    // new assignment starts already picked up. Once RETURNED_TO_STORE, any free rider can take it.
    const withRider = order.data.status === "DELIVERY_FAILED";
    if (withRider && existingAssignment?.delivery_partner_id !== data.delivery_partner_id) {
      throw new AppError("The last rider still has this order's goods: try again with them, or have them bring it back to the store first", 409);
    }
    // The pickup store is the order's own, never a client-supplied id.
    const warehouseId = order.data.warehouse_id;
    // The store panel assigns without a slot (the column is nullable); the admin dashboard still picks one.
    const [warehouseResponse, slot] = await Promise.all([
      fetch(`${env.INVENTORY_SERVICE_WAREHOUSE_URL}/${warehouseId}`),
      data.delivery_slot_id ? DeliverySlotRepository.getDeliverySlotById(data.delivery_slot_id) : null,
    ]);
    if (!warehouseId || !warehouseResponse.ok) {
      throw new AppError("warehose not found", 404);
    }
    const warehouse = await warehouseResponse.json();
    if (data.delivery_slot_id && !slot) {
      throw new AppError("Delivery slot not found", 404);
    }

    await this.availablePartner(data.delivery_partner_id, data.order_id);

    const db = await initializeModels();
    const transaction = await db.sequelize.transaction();
    try {
      const assignment =
        await DeliveryAssignmentRepository.createDeliveryAssignment(
          {
            order_id: data.order_id,
            delivery_partner_id: data.delivery_partner_id,
            delivery_slot_id: data.delivery_slot_id ?? null,
            ...this.jobFields(order.data, warehouse.data),
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
      // A retry with the rider holding the goods starts picked up (one row: two in one go could tie on created_at).
      await DeliveryStatusHistoryRepository.createStatusHistory(
        withRider
          ? { order_id: data.order_id, delivery_partner_id: data.delivery_partner_id, status: "PICKED_UP", remarks: "Retry: goods still with the rider" }
          : { order_id: data.order_id, delivery_partner_id: data.delivery_partner_id, status: "ASSIGNED" },
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

      if (withRider) {
        // The goods move from the failed assignment to this one, so the old one no longer owes the store anything.
        await DeliveryAssignmentRepository.updateById(existingAssignment.id, { returned_at: new Date() }, { transaction });
        // As SYSTEM: order-service only takes PICKED_UP from the store's pickup-code check, and this is that case's stand-in.
        const pickedUp = await fetch(`${env.ORDER_SERVICE_URL}/${data.order_id}/status`, {
          method: "PATCH",
          headers: { Authorization: this.buildSystemAuthorization(), "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PICKED_UP", remarks: "Retry with the same rider", changed_by: Number(user?.user_id) || undefined })
        });
        if (!pickedUp.ok) {
          throw new AppError("Failed to update order status to PICKED_UP", pickedUp.status || 500);
        }
      }

      await DeliveryPartnerRepository.updateDeliveryPartner(
        data.delivery_partner_id,
        { current_active_orders: Sequelize.literal("current_active_orders + 1") },
        { transaction }
      );

      await transaction.commit();

      // No timer here: the order stays ASSIGNED until the store hands it over with the rider's pickup code. A retry
      // with the rider who has the goods is already picked up, so it gets the same timers a pickup does.
      if (withRider) this.scheduleAutoProgression(assignment.id);
      return assignment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // The rider asked for, if they can take a job now: active, online, with room, and not holding goods owed to a store
  // (exceptOrderId: the order being retried with them, whose goods they hold on purpose).
  async availablePartner(partnerId, exceptOrderId) {
    const deliveryPartner = await DeliveryPartnerRepository.findOne({
      status: "ACTIVE",
      is_online: true,
      current_active_orders: {
        [Op.lt]: Sequelize.col("max_active_orders"),
      },
      id: { [Op.eq]: partnerId, ...notHoldingReturns(exceptOrderId).id },
    });
    if (!deliveryPartner) {
      throw new AppError("delivery partner is not available (offline, full, or still holding goods owed to a store)");
    }
    return deliveryPartner;
  }

  // What a job copies from the order and its store, so the rider's screens read without the other services.
  jobFields(order, warehouse) {
    return {
      warehouse_id: order.warehouse_id,
      zone_id: warehouse.zone_id,
      pickup_name: warehouse.name,
      pickup_address: warehouse.address,
      pickup_latitude: warehouse.latitude,
      pickup_longitude: warehouse.longitude,
      pickup_contact_name: warehouse.contact_person,
      pickup_contact_phone: warehouse.contact_phone,
      customer_name: order.address.full_name,
      customer_phone: order.address.phone,
      delivery_address: order.address.address_line_1,
      delivery_latitude: order.address.latitude,
      delivery_longitude: order.address.longitude,
    };
  }

  // A rider sent to collect a customer's approved returns (order-service, APPROVED): the customer first, then the
  // store, which takes the goods with the return code like any other return (receiveReturn). The returns are tied to
  // this job in order-service; one already taken by another rider's job ends here as a 409.
  async assignPickup(data, user, authorization) {
    // Read with the caller's token: store staff of another store get a 403 from order-service, a 404 here.
    const orderResponse = await fetch(`${env.ORDER_SERVICE_URL}/${data.order_id}`, { headers: { Authorization: authorization } });
    const order = await orderResponse.json();
    if (!order.success) {
      throw new AppError("order not found", 404);
    }
    if (!order.data.returns?.some((row) => row.status === "APPROVED" && !row.assignment_id)) {
      throw new AppError("No approved return on this order is waiting for a rider", 409);
    }
    const warehouseResponse = await fetch(`${env.INVENTORY_SERVICE_WAREHOUSE_URL}/${order.data.warehouse_id}`);
    if (!warehouseResponse.ok) {
      throw new AppError("warehose not found", 404);
    }
    const warehouse = await warehouseResponse.json();
    await this.availablePartner(data.delivery_partner_id);

    const db = await initializeModels();
    const transaction = await db.sequelize.transaction();
    let assignment;
    try {
      assignment = await DeliveryAssignmentRepository.createDeliveryAssignment({
        order_id: data.order_id,
        delivery_partner_id: data.delivery_partner_id,
        kind: "RETURN_PICKUP",
        ...this.jobFields(order.data, warehouse.data),
        assignment_source: "MANUAL",
        assigned_by: user?.user_id ?? null,
        assigned_at: new Date(),
      }, { transaction });
      await DeliveryAssignmentHistoryRepository.createAssignmentHistory(
        { order_id: data.order_id, assignment_id: assignment.id, action: "ASSIGNED" },
        { transaction },
      );
      await DeliveryPartnerRepository.updateDeliveryPartner(
        data.delivery_partner_id,
        { current_active_orders: Sequelize.literal("current_active_orders + 1") },
        { transaction },
      );
      await this.recordPickup(assignment, "ASSIGNED", Number(user?.user_id));
      await transaction.commit();
      return assignment;
    } catch (error) {
      // order-service may have tied the returns to this job (it saved, then our commit failed or its answer was lost):
      // untie them, or the store waits forever on a rider job that doesn't exist. A no-op when nothing was tied.
      if (assignment) {
        await this.recordPickup(assignment, "UNASSIGNED").catch((e) => logger.error(`Pickup ${assignment.id}: returns not released: ${e.message}`));
      }
      await transaction.rollback().catch(() => {});
      throw error;
    }
  }

  // The rider at the customer's door: collected (from now they owe the goods to the store, like a failed drop) or
  // not (the returns wait for another rider).
  async finishPickup(assignment, collected, actorId) {
    const db = await initializeModels();
    const transaction = await db.sequelize.transaction();
    try {
      const finished = await DeliveryAssignmentRepository.finishPickup(
        assignment.id,
        collected ? { status: "COMPLETED", return_due_at: new Date() } : { status: "FAILED" },
        { transaction },
      );
      if (!finished) {
        throw new AppError("This pickup is already finished", 409);
      }
      await DeliveryPartnerRepository.updateDeliveryPartner(
        assignment.delivery_partner_id,
        { current_active_orders: Sequelize.literal("GREATEST(current_active_orders - 1, 0)") },
        { transaction },
      );
      await DeliveryAssignmentHistoryRepository.createAssignmentHistory({
        order_id: assignment.order_id,
        assignment_id: assignment.id,
        action: collected ? "COMPLETED" : "CANCELLED",
        old_delivery_partner_id: assignment.delivery_partner_id,
      }, { transaction });
      await this.recordPickup(assignment, collected ? "COLLECTED" : "FAILED", actorId);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) throw error;
      throw new AppError(error.message, 500);
    }
  }

  // Moves the order's customer returns along with the pickup job (order-service returnPickup); failing it fails the caller.
  async recordPickup(assignment, step, actorId) {
    const response = await fetch(`${env.ORDER_SERVICE_URL}/${assignment.order_id}/returns/pickup`, {
      method: "POST",
      headers: { Authorization: this.buildSystemAuthorization(), "Content-Type": "application/json" },
      body: JSON.stringify({ assignment_id: assignment.id, step, ...(Number.isInteger(actorId) ? { changed_by: actorId } : {}) }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new AppError(body.message || "Failed to record the pickup on the order", response.status || 500);
    }
  }

  // For riders who don't move their own steps in the partner app: once the store has handed the order over
  // (PICKED_UP), simulate the rest of the timeline on a timer. Pickup itself is never simulated: only the store
  // confirms it, with the rider's code.
  // ponytail: in-memory timers don't survive a process restart — an order
  // mid-chain would freeze if this service redeploys. Acceptable for this
  // stage; a periodic sweep over stale assignments is the upgrade path if
  // that starts to matter.
  // Pending timers per assignment. A real status update (a partner's or staff's) cancels the rest, so a stale timer can
  // never overwrite it with a simulated step; updateStatus does that for every caller that passes a user.
  autoProgressionTimers = new Map();

  scheduleAutoProgression(assignmentId) {
    const steps = [
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

  // order-service saves its step before we commit ours. If our commit then failed (a crash, a timeout), the retry is
  // refused there as a repeat; the order already at `status` means that step went through, so the caller finishes its own.
  async orderIsAt(orderId, status) {
    const response = await fetch(`${env.ORDER_SERVICE_URL}/${orderId}`, { headers: { Authorization: this.buildSystemAuthorization() } });
    const order = await response.json().catch(() => null);
    return order?.data?.status === status;
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
    // HANDOVER_IN_PROGRESS with no open handover: an earlier request saved on the order but not here. This one finishes it.
    const halfSaved = order.data.status === "HANDOVER_IN_PROGRESS" && !(await DeliveryHandoverRepository.findOpenForAssignment(assignmentId));
    if (order.data.status !== "PICKED_UP" && !halfSaved) {
      throw new AppError("order is not eligible for handover", 409);
    }
    const deliveryPartner = await  DeliveryPartnerRepository.findOne({
      id: { [Op.eq]: data.new_delivery_partner_id, ...notHoldingReturns().id },
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
      if (!statusResponse.ok && !(await this.orderIsAt(assignment.order_id, "HANDOVER_IN_PROGRESS"))) {
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
      if (!statusResponse.ok && !(await this.orderIsAt(old.order_id, "OUT_FOR_DELIVERY"))) {
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
      if (!statusResponse.ok && !(await this.orderIsAt(handover.order_id, "PICKED_UP"))) {
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
  // Store accounts (manager, staff) see only their own store's assignments.
  async getAssignmentByOrder(orderId, user) {
    const assignment = await DeliveryAssignmentRepository.getDeliveryAssignmentByOrderId(orderId);
    if (!assignment) return null;
    assertOwnStore(user, assignment.warehouse_id);

    // The partner included with the assignment has name and phone hidden (default scope). This route is staff-only, so read them unscoped.
    const [partner, attempts] = await Promise.all([
      DeliveryPartnerRepository.findWithZone(assignment.delivery_partner_id),
      DeliveryAttemptRepository.getAttemptsByOrderId(orderId),
    ]);
    const slot = assignment.deliverySlot;
    const lastFailure = attempts[0];
    return {
      assignment_id: assignment.id,
      kind: assignment.kind,
      status: assignment.status,
      assigned_at: assignment.assigned_at,
      partner: partner ? { id: partner.id, name: partner.name, phone: partner.phone } : null,
      slot: slot ? { name: slot.name, start_time: slot.start_time, end_time: slot.end_time } : null,
      // Failed drops: what the store needs to choose between trying again and taking the goods back.
      attempts: attempts.length,
      max_attempts: MAX_DELIVERY_ATTEMPTS,
      last_failure: lastFailure
        ? { reason: lastFailure.failure_reason, reason_code: lastFailure.reason_code, at: lastFailure.attempted_at }
        : null,
      can_retry: attempts.length < MAX_DELIVERY_ATTEMPTS && !FINAL_FAILURES.has(lastFailure?.reason_code),
      // Goods this rider still owes the store (a failed drop, or items turned away at the door).
      return_due: Boolean(assignment.return_due_at && !assignment.returned_at),
      return_due_at: assignment.return_due_at,
      returned_at: assignment.returned_at,
      has_door_photo: Boolean(assignment.door_photo_key),
    };
  }

  // Store accounts (manager, staff) act on their own store's assignments only.
  assertStoreAccess(assignment, user) {
    assertOwnStore(user, assignment.warehouse_id);
  }

  // The store's "Coming back" list: goods riders still owe it, oldest first, with who has them. Store accounts see
  // their store; the super admin sees every store.
  async listReturnsDue(user) {
    const warehouseId = ownStore(user);
    const rows = await DeliveryAssignmentRepository.findReturnsDue(warehouseId);
    const contacts = new Map((await DeliveryPartnerRepository.findContacts([...new Set(rows.map((row) => row.delivery_partner_id))])).map((p) => [p.id, p]));
    const now = Date.now();

    return rows.map((row) => {
      const partner = contacts.get(row.delivery_partner_id);
      return {
        assignment_id: row.id,
        order_id: Number(row.order_id),
        warehouse_id: Number(row.warehouse_id),
        store_name: row.pickup_name,
        kind: returnKind(row),
        due_since: row.return_due_at,
        overdue: now - new Date(row.return_due_at).getTime() > RETURN_OVERDUE_MS,
        flagged_at: row.return_flagged_at,
        has_door_photo: Boolean(row.door_photo_key),
        partner: partner ? { id: partner.id, name: partner.name, phone: partner.phone } : null,
      };
    });
  }

  // The store takes back goods a rider owed it, with the return code the rider's app shows. The conditional UPDATE is
  // the transition (a double tap takes them back once); then order-service moves the order (RETURNED_TO_STORE) and the
  // turned-away items (RECEIVED) along. If that fails, nothing here is kept.
  async receiveReturn(assignmentId, data, user) {
    const assignment = await DeliveryAssignmentRepository.findById(assignmentId);
    if (!assignment || !assignment.return_due_at) {
      throw new AppError("Nothing is due back on this delivery", 404);
    }
    this.assertStoreAccess(assignment, user);
    if (assignment.returned_at) {
      throw new AppError("These goods were already taken back", 409);
    }
    if (!pickupCodeMatches(assignment.id, data.return_code, "return")) {
      throw new AppError("Return code doesn't match. Ask the rider for the code in their app", 400);
    }

    const db = await initializeModels();
    const transaction = await db.sequelize.transaction();
    try {
      if (!(await DeliveryAssignmentRepository.markReturned(assignment.id, { transaction }))) {
        throw new AppError("These goods were already taken back", 409);
      }
      await DeliveryStatusHistoryRepository.createStatusHistory({
        order_id: assignment.order_id,
        delivery_partner_id: assignment.delivery_partner_id,
        status: "RETURNED_TO_STORE",
        remarks: { CUSTOMER: "Customer return back at the store", FAILED_DELIVERY: "Order back at the store", DOORSTEP: "Turned-away items back at the store" }[returnKind(assignment)],
      }, { transaction });

      const actorId = Number(user?.user_id);
      const response = await fetch(`${env.ORDER_SERVICE_URL}/${assignment.order_id}/returns/arrived`, {
        method: "POST",
        headers: { Authorization: this.buildSystemAuthorization(), "Content-Type": "application/json" },
        body: JSON.stringify({ assignment_id: assignment.id, ...(Number.isInteger(actorId) ? { changed_by: actorId } : {}) }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new AppError(body.message || "Failed to record the return on the order", response.status || 500);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) throw error;
      throw new AppError(error.message, 500);
    }
    return { assignment_id: assignment.id, order_id: Number(assignment.order_id), returned_at: new Date() };
  }

  // The rider's photo of what was turned away at the door, for the store checking the return.
  async getDoorPhoto(assignmentId, user) {
    const assignment = await DeliveryAssignmentRepository.findById(assignmentId);
    if (!assignment?.door_photo_key) {
      throw new AppError("No photo for this delivery", 404);
    }
    this.assertStoreAccess(assignment, user);
    const bytes = await storage.get(assignment.door_photo_key);
    return { bytes, mime: detectMime(bytes) || "application/octet-stream" };
  }

  // Every few minutes: returns overdue (RETURN_OVERDUE_MS) are flagged once, and the store gets a text. The admin sees
  // the flag on the Returns page.
  async flagOverdueReturns() {
    const rows = await DeliveryAssignmentRepository.flagOverdueReturns(new Date(Date.now() - RETURN_OVERDUE_MS));
    if (rows.length === 0) return 0;
    const contacts = new Map((await DeliveryPartnerRepository.findContacts([...new Set(rows.map((row) => row.delivery_partner_id))])).map((p) => [p.id, p]));
    for (const row of rows) {
      logger.warn(`Return overdue: order ${row.order_id}, assignment ${row.id}`);
      if (!row.pickup_contact_phone) continue;
      void publishEvent("delivery.return.overdue", {
        orderId: row.order_id,
        phone: row.pickup_contact_phone,
        partnerName: contacts.get(row.delivery_partner_id)?.name ?? "The rider",
        partnerPhone: contacts.get(row.delivery_partner_id)?.phone ?? null,
      });
    }
    return rows.length;
  }

  // `user` is the caller; the auto-progression timers pass null, so only real updates cancel the timers.
  // `data.reason` is the failure reason on DELIVERY_FAILED. `actorId` is who to record on the order for a caller whose
  // own token is not forwarded (the partner app's updates go to the order service as SYSTEM).
  async updateStatus(assignmentId, data, user, authorizationHeader, actorId) {
    //check assignmet exist or not
    const assignment = await DeliveryAssignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new AppError("Assignment not found", 404);
    }
    // Read with the caller's token: store staff of another store get a 403 here, before anything changes.
    const orderResponse = await fetch(
      `${env.ORDER_SERVICE_URL}/${assignment.order_id}`,
      { headers: { Authorization: authorizationHeader } },
    );
    if (!orderResponse.ok) {
      throw new AppError("order is not found", 404);
    }
    // Pickup is the store handing the bags to the right rider: it needs the code the rider's app shows.
    if (data.status === "PICKED_UP" && !pickupCodeMatches(assignment.id, data.pickup_code)) {
      throw new AppError("Pickup code doesn't match. Ask the rider for the code in their app", 400);
    }
    if (user) this.cancelAutoProgression(assignmentId);
    // update assignment
    const db = await initializeModels();
    const transaction = await db.sequelize.transaction();
    let attemptNumber;
    try {
      // Locked, so a second tap waits for the first and then sees what it saved: a finished job, or this step already
      // the latest. Past this, our side is behind, which is what lets a refusal below be a half-saved step to finish.
      const current = await DeliveryAssignmentRepository.findById(assignmentId, { transaction, lock: transaction.LOCK.UPDATE });
      if (current.status !== "ACTIVE") {
        throw new AppError("This delivery is already finished", 409);
      }
      const [last] = await DeliveryStatusHistoryRepository.findAll(
        { order_id: assignment.order_id, delivery_partner_id: assignment.delivery_partner_id },
        { order: [["created_at", "DESC"]], limit: 1, transaction },
      );
      if (last?.status === data.status) {
        throw new AppError(`This order is already ${data.status.toLowerCase().replace(/_/g, " ")}`, 409);
      }
      const terminalAssignmentStatus = TERMINAL_ASSIGNMENT_STATUS[data.status];
      // The rider ends this job still carrying goods that belong to the store: the whole order (a failed drop) or what
      // was turned away at the door. They owe them back (return_due_at) until the store takes them with the return code.
      const holdsGoods = data.status === "DELIVERY_FAILED" || (data.status === "DELIVERED" && data.door?.rejected_items?.length > 0);

      if (terminalAssignmentStatus) {
        await DeliveryAssignmentRepository.updateById(
          assignmentId,
          { status: terminalAssignmentStatus, ...(holdsGoods ? { return_due_at: new Date() } : {}) },
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
          reason_code: data.reason_code ?? null,
          attempted_at: new Date(),
        }, { transaction });
      }
      // inform order or update order. PICKED_UP goes as SYSTEM (the code matched above), so order-service can refuse it
      // from a store staff token sent straight to it, without a code. The rider's "Delivered" (data.door) goes to
      // /deliver as SYSTEM with what happened at the door; a staff or timer DELIVERED is a plain status change.
      const pickedUp = data.status === "PICKED_UP";
      const updatedOrder = data.door
        ? await fetch(`${env.ORDER_SERVICE_URL}/${assignment.order_id}/deliver`, {
            method: "POST",
            headers: { Authorization: this.buildSystemAuthorization(), "Content-Type": "application/json" },
            body: JSON.stringify({
              assignment_id: assignment.id,
              rejected_items: data.door.rejected_items ?? [],
              ...(data.door.payment_method ? { payment_method: data.door.payment_method } : {}),
              ...(actorId ? { changed_by: actorId } : {}),
            }),
          })
        : await fetch(
            `${env.ORDER_SERVICE_URL}/${assignment.order_id}/status`,
            {
              method: "PATCH",
              headers: {
                Authorization: pickedUp ? this.buildSystemAuthorization() : authorizationHeader,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: data.status, remarks: data.reason, changed_by: actorId ?? (pickedUp && user ? Number(user.user_id) : undefined) }),
            },
          );
      if (!updatedOrder.ok && !(await this.orderIsAt(assignment.order_id, data.door ? "DELIVERED" : data.status))) {
        // order-service's own message (a QR not paid yet, an item that isn't on the order) is what the rider needs to see.
        const body = await updatedOrder.json().catch(() => ({}));
        throw new AppError(body.message || "Failed to update order status", updatedOrder.status || 500);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) throw error;
      throw new AppError(error.message, 500);
    }

    // Handed over: from here a rider who doesn't use the app is moved along on a timer (their own update cancels it).
    if (data.status === "PICKED_UP") this.scheduleAutoProgression(assignmentId);

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
