import DeliveryZoneRepository from "../repository/deliveryZone.repository.js";
import AppError from "../../utils/AppError.js";
import { env } from "../../config/env.js";
import { pickWarehouse } from "./serviceability.js";

class DeliveryZoneService {
  // Which warehouse delivers to { pincode, lat, lng }, with that zone's fee and delivery time.
  // ponytail: loads every active zone and warehouse per call; filter in SQL once there are dozens of each.
  async checkServiceability({ pincode, lat, lng }) {
    const [zones, warehouseResponse] = await Promise.all([
      DeliveryZoneRepository.getActiveZones(),
      fetch(`${env.INVENTORY_SERVICE_WAREHOUSE_URL}?limit=1000`),
    ]);
    if (!warehouseResponse.ok) {
      throw new AppError("Warehouse lookup failed", 502);
    }
    const { data } = await warehouseResponse.json();

    const match = pickWarehouse(zones, data.warehouses, { pincode, lat, lng });
    if (!match) return { serviceable: false, pincode: pincode ?? null };

    const { warehouse, zone } = match;
    return {
      serviceable: true,
      pincode: pincode ?? null,
      warehouse_id: Number(warehouse.id),
      zone_id: Number(zone.id),
      area: zone.name,
      city: zone.city,
      delivery_fee: Number(zone.delivery_fee),
      minimum_order_amount: Number(zone.minimum_order_amount),
      estimated_delivery_time: zone.estimated_delivery_time,
    };
  }

  async createDeliveryZone(data) {
    const existingZone = await DeliveryZoneRepository.getDeliveryZoneByCode(data.code);
    if (existingZone) {
      throw new AppError("Delivery zone code already exists", 409);
    }

    return await DeliveryZoneRepository.createDeliveryZone({
      ...data,
      delivery_fee: data.delivery_fee ?? 0,
      minimum_order_amount: data.minimum_order_amount ?? 0,
      is_active: data.is_active ?? true
    });
  }

  async getAllDeliveryZones(limit, offset, filters) {
    const { count, rows } = await DeliveryZoneRepository.getAllDeliveryZones(limit, offset, filters);
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(count / limit);

    return {
      deliveryZones: rows,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage,
        limit,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      }
    };
  }

  async getCities() {
    return { cities: await DeliveryZoneRepository.getCities() };
  }

  async getDeliveryZoneById(id) {
    const zone = await DeliveryZoneRepository.getDeliveryZoneById(id);
    if (!zone) {
      throw new AppError("Delivery zone not found", 404);
    }

    return zone;
  }


  async updateDeliveryZone(id, data) {
    await this.getDeliveryZoneById(id);

    if (data.code) {
      const existingZone = await DeliveryZoneRepository.getDeliveryZoneByCode(data.code);
      if (existingZone && String(existingZone.id) !== String(id)) {
        throw new AppError("Delivery zone code already exists", 409);
      }
    }

    await DeliveryZoneRepository.updateDeliveryZone(id, data);
    return await this.getDeliveryZoneById(id);
  }

  async deleteDeliveryZone(id) {
    const deleted = await DeliveryZoneRepository.deleteDeliveryZone(id);
    if (!deleted) {
      throw new AppError("Delivery zone not found", 404);
    }

    return true;
  }
}

export default new DeliveryZoneService();
