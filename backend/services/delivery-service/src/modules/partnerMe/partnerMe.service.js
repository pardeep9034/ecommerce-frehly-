import DeliveryAssignmentRepository from "../repository/deliveryAssignment.repository.js";
import DeliveryAttemptRepository from "../repository/deliveryAttempt.repository.js";
import DeliveryHandoverRepository, { OPEN_HANDOVER } from "../repository/deliveryHandover.repository.js";
import DeliveryPartnerRepository from "../repository/deliveryPartner.repository.js";
import DeliveryPartnerZoneRepository from "../repository/deliveryPartnerZone.repository.js";
import DeliveryStatusHistoryRepository from "../repository/deliveryStatusHistory.repository.js";
import HandleOrderService from "../handleOrder/handleOrder.service.js";
import { Op, literal } from "sequelize";
import * as storage from "../../utils/storage.js";
import { detectMime } from "../partnerApplication/partnerApplicationRules.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/Logger.js";
import { env } from "../../config/env.js";
import { failureText } from "../../constants/deliveryFailure.js";
import { pickupCode, pickupCodeMatches } from "../../utils/pickupCode.js";
import { returnKind } from "../../utils/returnHold.js";

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
// ASSIGNED has none: the store moves it to PICKED_UP when the rider shows their pickup code (pickupCode.js).
const NEXT_STEP = { PICKED_UP: "OUT_FOR_DELIVERY", OUT_FOR_DELIVERY: "DELIVERED" };
// A return pickup has one step: at the customer's, then collected or not (no timeline rows).
const PICKUP_STEP = { ACTIVE: "RETURN_PICKUP", COMPLETED: "COLLECTED", FAILED: "NOT_COLLECTED" };

// First row per order of a newest-first list.
const latestByOrder = (rows) => {
  const latest = new Map();
  for (const row of rows) if (!latest.has(String(row.order_id))) latest.set(String(row.order_id), row);
  return latest;
};

class PartnerMeService {
  async getMe(partner) {
    const [zones, stats, returnsDue] = await Promise.all([
      DeliveryPartnerZoneRepository.getZonesByPartner(partner.id),
      this.stats7d(partner.id),
      DeliveryAssignmentRepository.findAll(
        { delivery_partner_id: partner.id, return_due_at: { [Op.ne]: null }, returned_at: null },
        { order: [["return_due_at", "ASC"]] },
      ),
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
      // Goods to take back to the store, with the code the store types in. No new orders until this is empty.
      returns_due: returnsDue.map((row) => ({
        assignment_id: row.id,
        order_id: Number(row.order_id),
        kind: returnKind(row),
        store_name: row.pickup_name,
        store_address: row.pickup_address,
        due_since: row.return_due_at,
        return_code: pickupCode(row.id, "return"),
      })),
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
    const [steps, reasons, timeline, order] = await Promise.all([
      this.currentSteps(partner.id, [assignment], [assignment.order_id]),
      this.lastReasons(partner.id, [assignment.order_id]),
      DeliveryStatusHistoryRepository.findAll(
        { order_id: assignment.order_id, delivery_partner_id: partner.id },
        { order: [["created_at", "ASC"]] },
      ),
      this.fetchOrder(assignment.order_id),
    ]);

    const item = this.toItem(assignment, steps.get(assignment.id), reasons.get(String(assignment.order_id)));
    const open = assignment.status === "ACTIVE";
    const pickup = assignment.kind === "RETURN_PICKUP";
    return {
      ...item,
      // The phone and the map points are for doing the job; once it is over the partner has no reason to hold them.
      customer_phone: open ? assignment.customer_phone : null,
      pickup_contact_name: assignment.pickup_contact_name,
      pickup_contact_phone: open ? assignment.pickup_contact_phone : null,
      pickup_latitude: assignment.pickup_latitude,
      pickup_longitude: assignment.pickup_longitude,
      // Shown to the store at pickup; only while the order is still waiting there.
      pickup_code: open && item.status === "ASSIGNED" ? pickupCode(assignment.id) : null,
      delivery_latitude: assignment.delivery_latitude,
      delivery_longitude: assignment.delivery_longitude,
      order_items: order ? (pickup ? this.collectList(order, assignment) : this.packList(order)) : null,
      // At the door, while the job is open: what the customer can turn away and what to collect.
      door: open && order && !pickup ? this.doorView(order, assignment) : null,
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

  async updateAssignmentStatus(partner, user, assignmentId, { status, reason_code, note, delivery_code, rejected_items = [], payment_method }) {
    const reason = reason_code ? failureText(reason_code, note) : undefined;
    const assignment = await this.findOwned(partner, assignmentId);
    if (assignment.status !== "ACTIVE") {
      throw new AppError("This delivery is already finished", 409);
    }
    if (assignment.kind === "RETURN_PICKUP") {
      throw new AppError("This is a return pickup: mark it collected or not collected", 409);
    }
    // Delivered means the customer was there: they give the rider the code from their order page.
    if (status === "DELIVERED" && !pickupCodeMatches(assignment.order_id, delivery_code, "delivery")) {
      throw new AppError("Delivery code doesn't match. Ask the customer for the code on their order page", 400);
    }
    if (status === "DELIVERED" && rejected_items.length > 0 && !assignment.door_photo_key) {
      throw new AppError("Take a photo of the items the customer turned away first", 400);
    }
    // While a handover is open the order is on its way to someone else: withdraw it first, or the two would race.
    if (await DeliveryHandoverRepository.findOpenForAssignment(assignment.id)) {
      throw new AppError("This order has an open handover; withdraw it first", 409);
    }
    const step = (await this.currentSteps(partner.id, [assignment], [assignment.order_id])).get(assignment.id);
    if (step === "ASSIGNED" && status === "PICKED_UP") {
      throw new AppError("The store confirms the pickup: show them your pickup code", 409);
    }
    if (status !== "DELIVERY_FAILED" && NEXT_STEP[step] !== status) {
      throw new AppError(`Cannot move from ${step} to ${status}`, 409);
    }

    // The order service only takes ADMIN/SUPPORT/SYSTEM tokens, so the partner's own is not forwarded: ownership and the
    // move were checked above, and the partner's id goes in as the person who made the change.
    await HandleOrderService.updateStatus(
      assignment.id,
      { status, reason, reason_code, ...(status === "DELIVERED" ? { door: { rejected_items, payment_method } } : {}) },
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
      a.kind === "RETURN_PICKUP" ? PICKUP_STEP[a.status] ?? a.status
        : a.status === "ACTIVE" ? (latest.get(String(a.order_id))?.status ?? "ASSIGNED") : FINISHED_STEP[a.status],
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
      kind: assignment.kind,
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

  // The order from the order service (only it has the lines and the payment). null when it cannot be reached: the
  // screen can still work the delivery without it, so this does not fail the request.
  async fetchOrder(orderId) {
    try {
      const response = await fetch(`${env.ORDER_SERVICE_URL}/${orderId}`, {
        headers: { Authorization: HandleOrderService.buildSystemAuthorization() },
      });
      if (!response.ok) throw new Error(`order service answered ${response.status}`);
      return (await response.json()).data;
    } catch (error) {
      logger.warn(`Order ${orderId} unavailable: ${error.message}`);
      return null;
    }
  }

  // What to pack.
  packList(order) {
    return (order.items ?? [])
      .filter((item) => item.status !== "NOT_AVAILABLE")
      .map((item) => ({
        // variant_name is "<product> - <unit>" today, so the product name and the unit are all a packer needs.
        name: item.product_name,
        qty: `${Number(item.quantity)} ${item.unit ?? ""}`.trim(),
      }));
  }

  // A return pickup: the customer's returns this job collects, as the pack list shows them.
  collectList(order, assignment) {
    const items = new Map((order.items ?? []).map((item) => [Number(item.id), item]));
    return (order.returns ?? [])
      .filter((row) => row.assignment_id === assignment.id)
      .map((row) => {
        const item = items.get(Number(row.order_item_id));
        return { name: item?.product_name ?? "Item", qty: `${Number(row.quantity)} ${item?.unit ?? ""}`.trim() };
      });
  }

  // The rider at the customer's door on a return pickup. Collected: they now owe the goods to the store (Home shows
  // the return code). Not collected: the store sends someone again.
  async finishPickup(partner, user, assignmentId, collected) {
    const assignment = await this.findOwned(partner, assignmentId);
    if (assignment.kind !== "RETURN_PICKUP") throw new AppError("This job is a delivery", 409);
    if (assignment.status !== "ACTIVE") throw new AppError("This pickup is already finished", 409);
    await HandleOrderService.finishPickup(assignment, collected, Number(user.user_id));
    const fresh = await this.findOwned(partner, assignmentId);
    return this.toItem(fresh, PICKUP_STEP[fresh.status], null);
  }

  // What the Confirm screen needs at the door. amount_due is before anything is turned away; the app takes those off
  // as the rider marks them (order-service works it out again on the way in).
  doorView(order, assignment) {
    const payAtDoor = order.latest_payment?.payment_method === "COD" || order.collected_method === "UPI";
    const toPay = Math.max(0, Math.round((Number(order.total_amount) - Number(order.refunded_amount)) * 100) / 100);
    return {
      pay_at_door: payAtDoor,
      amount_due: payAtDoor ? toPay : 0,
      paid_by_upi: order.collected_method === "UPI",
      has_photo: Boolean(assignment.door_photo_key),
      items: (order.items ?? [])
        .filter((item) => item.status !== "NOT_AVAILABLE")
        .map((item) => ({
          order_item_id: Number(item.id),
          name: item.product_name,
          unit: item.unit,
          quantity: Number(item.quantity),
          unit_price: Math.round((Number(item.line_total) / Number(item.quantity)) * 100) / 100,
        })),
    };
  }

  // The rider's photo of what the customer turned away. JPEG or PNG only (uploadDocument also lets PDFs through).
  // A new photo replaces the last one.
  async uploadDoorPhoto(partner, assignmentId, file) {
    const assignment = await this.findOwned(partner, assignmentId);
    if (assignment.status !== "ACTIVE") throw new AppError("This delivery is already finished", 409);
    const mime = detectMime(file.buffer);
    if (!["image/jpeg", "image/png"].includes(mime)) throw new AppError("The photo must be a JPEG or PNG", 415);

    const key = `door-photos/${assignment.id}/${Date.now()}.${mime === "image/png" ? "png" : "jpg"}`;
    await storage.put(key, file.buffer);
    await DeliveryAssignmentRepository.updateById(assignment.id, { door_photo_key: key });
    if (assignment.door_photo_key) {
      storage.remove(assignment.door_photo_key).catch((error) => logger.warn(`Old door photo not removed: ${error.message}`));
    }
    return { has_photo: true };
  }

  // The door QR (pay on delivery by UPI), proxied to order-service as SYSTEM once the rider is known to own the open
  // job. method: POST shows a new one (also Retry), GET checks it, DELETE closes it (Switch to cash).
  async doorQr(partner, assignmentId, method, body) {
    const assignment = await this.findOwned(partner, assignmentId);
    if (assignment.status !== "ACTIVE") throw new AppError("This delivery is already finished", 409);
    const response = await fetch(`${env.ORDER_SERVICE_URL}/${assignment.order_id}/door-qr`, {
      method,
      headers: { Authorization: HandleOrderService.buildSystemAuthorization(), "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new AppError(result.message || "The QR is unavailable right now", response.status || 502);
    return result.data;
  }
}

export default new PartnerMeService();
