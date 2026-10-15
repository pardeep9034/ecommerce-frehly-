import DeliveryAssignmentRepository from "../repository/deliveryAssignment.repository.js";
import DeliveryAttemptRepository from "../repository/deliveryAttempt.repository.js";
import DeliveryPartnerRepository from "../repository/deliveryPartner.repository.js";
import DeliveryPartnerZoneRepository from "../repository/deliveryPartnerZone.repository.js";
import DeliveryStatusHistoryRepository from "../repository/deliveryStatusHistory.repository.js";
import HandleOrderService from "../handleOrder/handleOrder.service.js";
import { literal } from "sequelize";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/Logger.js";
import { env } from "../../config/env.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_MS = 330 * 60 * 1000;
// ponytail: Freshly delivers in India only, so "today" is the IST calendar day. A second timezone needs an offset per zone.
const startOfToday = () => new Date(Math.floor((Date.now() + IST_MS) / DAY_MS) * DAY_MS - IST_MS);

const FINISHED = ["COMPLETED", "FAILED", "TRANSFERRED", "CANCELLED"];
// What a finished assignment shows as its step: the delivery words for the assignment's own status.
const FINISHED_STEP = { COMPLETED: "DELIVERED", FAILED: "DELIVERY_FAILED", TRANSFERRED: "TRANSFERRED", CANCELLED: "CANCELLED" };
// The one forward move from each open step. DELIVERY_FAILED is allowed from any open step.
const NEXT_STEP = { ASSIGNED: "PICKED_UP", PICKED_UP: "OUT_FOR_DELIVERY", OUT_FOR_DELIVERY: "DELIVERED" };

// First row per order of a newest-first list.
const latestByOrder = (rows) => {
  const latest = new Map();
  for (const row of rows) if (!latest.has(String(row.order_id))) latest.set(String(row.order_id), row);
  return latest;
};

class PartnerMeService {
  async getMe(partner) {
    const [zones, counts] = await Promise.all([
      DeliveryPartnerZoneRepository.getZonesByPartner(partner.id),
      DeliveryAssignmentRepository.countByStatusSince(partner.id, new Date(Date.now() - 7 * DAY_MS)),
    ]);
    return {
      id: partner.id,
      user_id: partner.user_id,
      name: partner.name,
      phone: partner.phone,
      vehicle_type: partner.vehicle_type,
      vehicle_number: partner.vehicle_number,
      max_active_orders: partner.max_active_orders,
      current_active_orders: partner.current_active_orders,
      status: partner.status,
      is_online: partner.is_online,
      joined_at: partner.joined_at,
      zones: zones.map((row) => ({ id: row.zone.id, name: row.zone.name, is_primary: row.is_primary })),
      // No on-time rate: nothing records the promised time against the actual one.
      stats: { delivered_7d: counts.COMPLETED ?? 0, failed_7d: counts.FAILED ?? 0 },
    };
  }

  async listAssignments(partner, { status, date, page, limit }) {
    const statuses = status === "ACTIVE" ? ["ACTIVE"] : status === "HISTORY" ? FINISHED : [status];
    // "today" narrows finished work (what I delivered today); open work is open whatever day it was assigned.
    const since = status !== "ACTIVE" && date === "today" ? startOfToday() : undefined;
    const { rows, count } = await DeliveryAssignmentRepository.findForPartner(partner.id, {
      statuses,
      since,
      limit,
      offset: (page - 1) * limit,
    });

    const orderIds = rows.map((row) => row.order_id);
    const [steps, reasons] = await Promise.all([this.currentSteps(partner.id, rows, orderIds), this.lastReasons(partner.id, orderIds)]);
    return {
      items: rows.map((row) => this.toItem(row, steps.get(row.id), reasons.get(String(row.order_id)))),
      total: count,
      page,
      limit,
    };
  }

  async getAssignment(partner, assignmentId) {
    const assignment = await this.findOwned(partner, assignmentId);
    const [steps, reasons, timeline, orderItems] = await Promise.all([
      this.currentSteps(partner.id, [assignment], [assignment.order_id]),
      this.lastReasons(partner.id, [assignment.order_id]),
      DeliveryStatusHistoryRepository.findAll(
        { order_id: assignment.order_id, delivery_partner_id: partner.id },
        { order: [["created_at", "ASC"]] },
      ),
      this.fetchOrderItems(assignment.order_id),
    ]);

    const item = this.toItem(assignment, steps.get(assignment.id), reasons.get(String(assignment.order_id)));
    const open = assignment.status === "ACTIVE";
    return {
      ...item,
      // The phone and the map points are for doing the job; once it is over the partner has no reason to hold them.
      customer_phone: open ? assignment.customer_phone : null,
      pickup_contact_name: assignment.pickup_contact_name,
      pickup_contact_phone: open ? assignment.pickup_contact_phone : null,
      pickup_latitude: assignment.pickup_latitude,
      pickup_longitude: assignment.pickup_longitude,
      delivery_latitude: assignment.delivery_latitude,
      delivery_longitude: assignment.delivery_longitude,
      order_items: orderItems,
      status_history: timeline.map((row) => ({ status: row.status, remarks: row.remarks, created_at: row.created_at })),
    };
  }
  // Sets a state, never flips one, so a retry or a double tap lands in the same place. One statement, no read first:
  // Postgres evaluates every right-hand side against the old row, so online_since keeps the moment the partner first went
  // online when already online, starts at now() when they were offline, and is cleared going offline. RETURNING gives the row back.
  async setOnlineStatus(partnerId, online) {
    const [, [row]] = await DeliveryPartnerRepository.updateDeliveryPartner(
      partnerId,
      { is_online: online, online_since: online ? literal('CASE WHEN "is_online" THEN COALESCE("online_since", now()) ELSE now() END') : null },
      { returning: ["id", "is_online"] },
    );
    if (!row) throw new AppError("Partner not found", 404);
    return { id: row.id, is_online: row.is_online };
  }

  async updateAssignmentStatus(partner, user, assignmentId, { status, reason }) {
    const assignment = await this.findOwned(partner, assignmentId);
    if (assignment.status !== "ACTIVE") {
      throw new AppError("This delivery is already finished", 409);
    }
    const step = (await this.currentSteps(partner.id, [assignment], [assignment.order_id])).get(assignment.id);
    if (status !== "DELIVERY_FAILED" && NEXT_STEP[step] !== status) {
      throw new AppError(`Cannot move from ${step} to ${status}`, 409);
    }

    // The order service only takes ADMIN/SUPPORT/SYSTEM tokens, so the partner's own is not forwarded: ownership and the
    // move were checked above, and the partner's id goes in as the person who made the change.
    await HandleOrderService.updateStatus(
      assignment.id,
      { status, reason },
      user,
      HandleOrderService.buildSystemAuthorization(),
      Number(user.user_id),
    );
    const fresh = await this.findOwned(partner, assignmentId);
    const [steps, reasons] = await Promise.all([
      this.currentSteps(partner.id, [fresh], [fresh.order_id]),
      this.lastReasons(partner.id, [fresh.order_id]),
    ]);
    return this.toItem(fresh, steps.get(fresh.id), reasons.get(String(fresh.order_id)));
  }

  // Someone else's assignment answers the same 404 as one that does not exist.
  async findOwned(partner, assignmentId) {
    const assignment = await DeliveryAssignmentRepository.findOne({ id: assignmentId, delivery_partner_id: partner.id });
    if (!assignment) throw new AppError("Assignment not found", 404);
    return assignment;
  }

  // Map of assignment id -> step. A finished assignment shows its outcome; an open one its latest timeline row
  // (ASSIGNED when none was written, as for an assignment made before the timeline existed).
  async currentSteps(partnerId, assignments, orderIds) {
    const open = assignments.some((a) => a.status === "ACTIVE");
    const latest = open
      ? latestByOrder(await DeliveryStatusHistoryRepository.findAll(
          { order_id: orderIds, delivery_partner_id: partnerId },
          { order: [["created_at", "DESC"]] },
        ))
      : new Map();
    return new Map(assignments.map((a) => [
      a.id,
      a.status === "ACTIVE" ? (latest.get(String(a.order_id))?.status ?? "ASSIGNED") : FINISHED_STEP[a.status],
    ]));
  }

  // Map of order id -> reason of this partner's latest failed attempt.
  async lastReasons(partnerId, orderIds) {
    if (orderIds.length === 0) return new Map();
    const attempts = await DeliveryAttemptRepository.findAll(
      { order_id: orderIds, delivery_partner_id: partnerId },
      { order: [["attempted_at", "DESC"]] },
    );
    return new Map([...latestByOrder(attempts)].map(([orderId, attempt]) => [orderId, attempt.failure_reason]));
  }

  toItem(assignment, step, lastReason) {
    return {
      id: assignment.id,
      order_id: Number(assignment.order_id),
      status: step,
      assignment_status: assignment.status,
      pickup_name: assignment.pickup_name,
      pickup_address: assignment.pickup_address,
      customer_name: assignment.customer_name,
      delivery_address: assignment.delivery_address,
      assigned_at: assignment.assigned_at,
      updated_at: assignment.updated_at,
      last_attempt_reason: lastReason ?? null,
    };
  }

  // What to pack, from the order service (only it has the lines). null when it cannot be reached: the screen can still
  // work the delivery without the list, so this does not fail the request.
  async fetchOrderItems(orderId) {
    try {
      const response = await fetch(`${env.ORDER_SERVICE_URL}/${orderId}`, {
        headers: { Authorization: HandleOrderService.buildSystemAuthorization() },
      });
      if (!response.ok) throw new Error(`order service answered ${response.status}`);
      const { data } = await response.json();
      return (data.items ?? [])
        .filter((item) => item.status !== "NOT_AVAILABLE")
        .map((item) => ({
          // variant_name is "<product> - <unit>" today, so the product name and the unit are all a packer needs.
          name: item.product_name,
          qty: `${Number(item.quantity)} ${item.unit ?? ""}`.trim(),
        }));
    } catch (error) {
      logger.warn(`Order items for order ${orderId} unavailable: ${error.message}`);
      return null;
    }
  }
}

export default new PartnerMeService();
