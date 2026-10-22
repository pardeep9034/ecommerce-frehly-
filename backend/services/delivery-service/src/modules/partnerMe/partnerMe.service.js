import DeliveryAssignmentRepository from "../repository/deliveryAssignment.repository.js";
import DeliveryAttemptRepository from "../repository/deliveryAttempt.repository.js";
import DeliveryHandoverRepository, { OPEN_HANDOVER } from "../repository/deliveryHandover.repository.js";
import DeliveryPartnerRepository from "../repository/deliveryPartner.repository.js";
import DeliveryPartnerZoneRepository from "../repository/deliveryPartnerZone.repository.js";
import DeliveryStatusHistoryRepository from "../repository/deliveryStatusHistory.repository.js";
import HandleOrderService from "../handleOrder/handleOrder.service.js";
import { literal } from "sequelize";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/Logger.js";
import { env } from "../../config/env.js";
import { failureText } from "../../constants/deliveryFailure.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_MS = 330 * 60 * 1000;
// ponytail: Freshly delivers in India only, so "today" is the IST calendar day. A second timezone needs an offset per zone.
const startOfToday = () => new Date(Math.floor((Date.now() + IST_MS) / DAY_MS) * DAY_MS - IST_MS);
// Midnight IST that starts a "YYYY-MM-DD" day.
const istDay = (day) => new Date(`${day}T00:00:00+05:30`);

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
    const [zones, stats] = await Promise.all([
      DeliveryPartnerZoneRepository.getZonesByPartner(partner.id),
      this.stats7d(partner.id),
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
      stats,
    };
  }

  // Last 7 days, for the partner's Home and the admin partner page.
  // No on-time rate: nothing records the promised time against the actual one.
  async stats7d(partnerId) {
    const since = new Date(Date.now() - 7 * DAY_MS);
    const [counts, handovers] = await Promise.all([
      DeliveryAssignmentRepository.countByStatus(partnerId, { from: since }),
      DeliveryHandoverRepository.countForPartner(partnerId, since),
    ]);
    return {
      delivered_7d: counts.COMPLETED ?? 0,
      failed_7d: counts.FAILED ?? 0,
      handovers_given_7d: handovers.given,
      handovers_received_7d: handovers.received,
    };
  }

  // The admin partner page: the same 7-day stats and open jobs the partner sees in their own app.
  async getWork(partnerId) {
    const partner = await DeliveryPartnerRepository.findById(partnerId);
    if (!partner) throw new AppError("Delivery partner not found", 404);
    const [stats, active] = await Promise.all([
      this.stats7d(partner.id),
      this.listAssignments(partner, { status: "ACTIVE", page: 1, limit: 50 }),
    ]);
    return { stats, active: active.items };
  }

  // `from` / `to` are IST calendar days (both included) and, like "today", only narrow finished work: open work is open
  // whatever day it was assigned. `counts` is per finished status under the same date and search filters.
  async listAssignments(partner, { status, date, from, to, search, page, limit }) {
    const statuses = status === "ACTIVE" ? ["ACTIVE"] : status === "HISTORY" ? FINISHED : [status];
    const filters = { search };
    if (status !== "ACTIVE") {
      filters.from = date === "today" ? startOfToday() : from && istDay(from);
      filters.to = to && new Date(istDay(to).getTime() + DAY_MS);
    }
    const [{ rows, count }, counts] = await Promise.all([
      DeliveryAssignmentRepository.findForPartner(partner.id, { ...filters, statuses, limit, offset: (page - 1) * limit }),
      DeliveryAssignmentRepository.countByStatus(partner.id, filters),
    ]);

    const orderIds = rows.map((row) => row.order_id);
    const [steps, reasons] = await Promise.all([this.currentSteps(partner.id, rows, orderIds), this.lastReasons(partner.id, orderIds)]);
    return {
      items: rows.map((row) => this.toItem(row, steps.get(row.id), reasons.get(String(row.order_id)))),
      total: count,
      counts: Object.fromEntries(FINISHED.map((s) => [s, counts[s] ?? 0])),
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

  async updateAssignmentStatus(partner, user, assignmentId, { status, reason_code, note }) {
    const reason = reason_code ? failureText(reason_code, note) : undefined;
    const assignment = await this.findOwned(partner, assignmentId);
    if (assignment.status !== "ACTIVE") {
      throw new AppError("This delivery is already finished", 409);
    }
    // While a handover is open the order is on its way to someone else: withdraw it first, or the two would race.
    if (await DeliveryHandoverRepository.findOpenForAssignment(assignment.id)) {
      throw new AppError("This order has an open handover; withdraw it first", 409);
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

  // The Handover screen. "in" = handed to this partner, "out" = handed on by them; open ones plus today's finished ones.
  // The other partner's phone is shown only while the handover is open (they need to meet), like the customer's phone.
  async listHandovers(partner, dir) {
    const rows = await DeliveryHandoverRepository.listForPartner(partner.id, dir, startOfToday());
    const otherKey = dir === "in" ? "old_delivery_partner_id" : "new_delivery_partner_id";
    const [contacts, assignments] = await Promise.all([
      DeliveryPartnerRepository.findContacts([...new Set(rows.map((h) => h[otherKey]).filter(Boolean))]),
      DeliveryAssignmentRepository.findAll({ id: [...new Set(rows.map((h) => h.assignment_id))] }),
    ]);
    const contactById = new Map(contacts.map((p) => [p.id, p]));
    const assignmentById = new Map(assignments.map((a) => [a.id, a]));

    return rows.map((h) => {
      const open = OPEN_HANDOVER.includes(h.status);
      const other = contactById.get(h[otherKey]);
      const assignment = assignmentById.get(h.assignment_id);
      return {
        id: h.id,
        status: h.status,
        order_id: Number(h.order_id),
        assignment_id: h.assignment_id,
        reason: h.reason,
        handover_latitude: h.handover_latitude,
        handover_longitude: h.handover_longitude,
        created_at: h.created_at,
        old_partner_confirmed_at: h.old_partner_confirmed_at,
        receipt_confirmed_at: h.receipt_confirmed_at,
        cancelled_at: h.cancelled_at,
        cancelled_by: h.status !== "CANCELLED" ? null : !h.cancelled_by ? "STAFF" : h.cancelled_by === partner.id ? "YOU" : "OTHER",
        other_partner: other ? { id: other.id, name: other.name, phone: open ? other.phone : null } : null,
        customer_name: assignment?.customer_name ?? null,
        delivery_address: assignment?.delivery_address ?? null,
      };
    });
  }

  // Who this partner can hand one of their open orders to: the order's zone (the partner's own when the order has none).
  async handoverCandidates(partner, assignmentId) {
    const assignment = await this.findOwned(partner, assignmentId);
    if (assignment.status !== "ACTIVE") throw new AppError("This delivery is already finished", 409);
    const rows = await DeliveryPartnerRepository.findHandoverCandidates(assignment.zone_id ?? partner.zone_id, partner.id);
    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      vehicle_type: p.vehicle_type,
      current_active_orders: p.current_active_orders,
      max_active_orders: p.max_active_orders,
    }));
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
      completed_at: assignment.completed_at,
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
