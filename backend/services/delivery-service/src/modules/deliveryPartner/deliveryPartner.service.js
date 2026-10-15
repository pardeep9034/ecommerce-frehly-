import DeliveryPartnerRepository from "../repository/deliveryPartner.repository.js";
import DeliveryPartnerZoneRepository from "../repository/deliveryPartnerZone.repository.js";
import PartnerApplicationRepository from "../repository/partnerApplication.repository.js";
import DeliveryAssignmentRepository from "../repository/deliveryAssignment.repository.js";
import { Op, Sequelize } from "sequelize";
import AppError from "../../utils/AppError.js";
import { env } from "../../config/env.js";
import { calculateDistance, maskPhone } from "../../utils/helper.js";
import { literal } from "sequelize";

const PARTNER_STATUSES = ["ACTIVE", "SUSPENDED", "INACTIVE"];

class DeliveryPartnerService {
  async createDeliveryPartner(data, user) {
    const userId = user.user_id;
 
    const existingPartner = await DeliveryPartnerRepository.getDeliveryPartnerByUserId(userId);
    if (existingPartner) {
      throw new AppError("Delivery partner already exists for this user", 409);
    }

    const existingVehicle = await DeliveryPartnerRepository.getDeliveryPartnerByVehicleNumber(
      data.vehicle_number
    );
    if (existingVehicle) {
      throw new AppError("Vehicle number already exists", 409);
    }

    return await DeliveryPartnerRepository.createDeliveryPartner({
      user_id: userId,
      name: data.name ?? null,
      phone: data.phone ?? null,
      vehicle_type: data.vehicle_type,
      vehicle_number: data.vehicle_number,
      max_active_orders: Number(data.max_active_orders),
      status: "ACTIVE",
      current_latitude: data.current_latitude ?? null,
      current_longitude: data.current_longitude ?? null,
      last_location_update_at: data.current_latitude !== undefined && data.current_longitude !== undefined
        ? new Date()
        : null,
      joined_at: new Date()
    });
  }

  async getAllDeliveryPartnersByZoneId(zone_id) {
    return await DeliveryPartnerRepository.findAll({
      status: "ACTIVE",
      is_online: true,
      zone_id,
      current_active_orders: {
        [Op.lt]: Sequelize.col("max_active_orders")
      }
    }, {
      order: [["current_active_orders", "ASC"]]
    });
  }

  async getAvalableDeliveryPartners(warehouseId) {
    const response = await fetch(`${env.INVENTORY_SERVICE_WAREHOUSE_URL}/${warehouseId}`);
    if (!response.ok) {
      throw new AppError("Warehouse not found", 404);
    }
    const warehouse = await response.json();

    const partners = await this.getAllDeliveryPartnersByZoneId(warehouse.data.zone_id);
    if (!partners || partners.length === 0) {
      throw new AppError("No active delivery partners available in the zone", 404);
    }

    const riderWithDistance = partners.map((partner) => {
      const distance = calculateDistance(
        warehouse.data.latitude,
        warehouse.data.longitude,
        partner.current_latitude,
        partner.current_longitude
      );
      return { ...partner.toJSON(), distance };
    });
    return riderWithDistance.sort((a, b) => a.distance - b.distance);
  }

  // Partner list for the dashboard: search + zone + status + online + pagination.
  async listPartners(query = {}) {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);

    let status;
    if (query.status) {
      if (!PARTNER_STATUSES.includes(query.status)) throw new AppError("status must be ACTIVE, SUSPENDED or INACTIVE", 400);
      status = query.status;
    }

    let online;
    if (query.online !== undefined && query.online !== "") {
      if (!["true", "false"].includes(query.online)) throw new AppError("online must be true or false", 400);
      online = query.online === "true";
    }

    let zoneId;
    if (query.zone_id !== undefined && query.zone_id !== "") {
      zoneId = Number(query.zone_id);
      if (!Number.isInteger(zoneId) || zoneId <= 0) throw new AppError("zone_id must be a positive number", 400);
    }

    const search = String(query.search ?? "").trim() || undefined;

    const { count, rows } = await DeliveryPartnerRepository.findPartners({
      search, zoneId, status, online, limit, offset: (page - 1) * limit
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const deliveredToday = await DeliveryAssignmentRepository.countCompletedSince(rows.map((row) => row.id), startOfToday);

    const totalPages = Math.ceil(count / limit);
    return {
      partners: rows.map((row) => ({
        id: row.id,
        name: row.name,
        phone: maskPhone(row.phone),
        zone: row.zone ? { id: Number(row.zone.id), name: row.zone.name } : null,
        vehicle_type: row.vehicle_type,
        vehicle_number: row.vehicle_number,
        is_online: row.is_online,
        online_since: row.online_since,
        current_active_orders: row.current_active_orders,
        max_active_orders: row.max_active_orders,
        delivered_today: deliveredToday[row.id] ?? 0,
        status: row.status,
        joined_at: row.joined_at,
        last_location_update_at: row.last_location_update_at
      })),
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  // How this partner came on, for the staff partner page (P3). A partner an admin created directly has no application and
  // gets empty lists. Documents are masked only; the files and the hash columns never leave the review path.
  async getOnboarding(id) {
    const partner = await DeliveryPartnerRepository.findWithZone(id);
    if (!partner) throw new AppError("Delivery partner not found", 404);

    const view = {
      partner: {
        id: partner.id,
        name: partner.name,
        phone: maskPhone(partner.phone),
        vehicle_type: partner.vehicle_type,
        vehicle_number: partner.vehicle_number,
        zone: partner.zone ? { id: Number(partner.zone.id), name: partner.zone.name } : null,
        status: partner.status,
        max_active_orders: partner.max_active_orders,
        joined_at: partner.joined_at,
      },
      application: null,
      documents: [],
      events: [],
    };
    const application = partner.application_id ? await PartnerApplicationRepository.findDetail(partner.application_id) : null;
    if (!application) return view;

    const byTime = (x, y) => new Date(x.created_at) - new Date(y.created_at);
    return {
      ...view,
      application: {
        id: application.id,
        ref: `FR-P-${application.ref_no}`,
        source: application.source,
        status: application.status,
        created_by: application.created_by === null ? null : Number(application.created_by),
        submitted_at: application.submitted_at,
        decided_at: application.decided_at,
      },
      documents: application.documents.map((d) => ({
        type: d.type, status: d.status, number_masked: d.number_masked, expiry_date: d.expiry_date, uploaded_at: d.uploaded_at, verified_at: d.verified_at,
      })),
      // Opening a file is for the audit trail; it would only bury the story here (as on the review screen).
      events: [...application.events].filter((e) => e.type !== "DOC_VIEWED").sort(byTime).map((e) => ({
        type: e.type, actor_id: e.actor_id === null ? null : Number(e.actor_id), actor_role: e.actor_role, payload: e.payload, created_at: e.created_at,
      })),
    };
  }


  async getDeliveryPartnerById(id) {
    const partner = await DeliveryPartnerRepository.getDeliveryPartnerById(id);

    if (!partner) {
      throw new AppError("Delivery partner not found", 404);
    }

    return partner;
  }

  async updateDeliveryPartner(id, data) {
    const partner = await this.getDeliveryPartnerById(id);
    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.vehicle_type !== undefined) updateData.vehicle_type = data.vehicle_type;
    if (data.vehicle_number !== undefined) updateData.vehicle_number = data.vehicle_number;
    if (data.max_active_orders !== undefined) updateData.max_active_orders = data.max_active_orders;
    if (data.status !== undefined) updateData.status = data.status;

    if (updateData.vehicle_number && updateData.vehicle_number !== partner.vehicle_number) {
      const existingVehicle = await DeliveryPartnerRepository.getDeliveryPartnerByVehicleNumber(
        updateData.vehicle_number
      );

      if (existingVehicle) {
        throw new AppError("Vehicle number already exists", 409);
      }
    }

    await DeliveryPartnerRepository.updateDeliveryPartner(id, updateData);
    return await this.getDeliveryPartnerById(id);
  }

  async updateLocation(id, data) {
    await this.getDeliveryPartnerById(id);

    await DeliveryPartnerRepository.updateDeliveryPartner(id, {
      current_latitude: data.current_latitude,
      current_longitude: data.current_longitude,
      last_location_update_at: new Date()
    });

    return await this.getDeliveryPartnerById(id);
  }

  async updateStatus(id, status) {
    await this.getDeliveryPartnerById(id);
    await DeliveryPartnerRepository.updateDeliveryPartner(id, { status });
    return await this.getDeliveryPartnerById(id);
  }
}

export default new DeliveryPartnerService();
