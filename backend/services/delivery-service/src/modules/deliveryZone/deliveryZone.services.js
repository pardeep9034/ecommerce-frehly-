import DeliveryZoneRepository from "../repository/deliveryZone.repository.js";
import AppError from "../../utils/AppError.js";

class DeliveryZoneService {
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

  async getAllDeliveryZones(limit, offset) {
    const { count, rows } = await DeliveryZoneRepository.getAllDeliveryZones(limit, offset);
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

  async getDeliveryZoneById(id) {
    const zone = await DeliveryZoneRepository.getDeliveryZoneById(id);
    if (!zone) {
      throw new AppError("Delivery zone not found", 404);
    }

    return zone;
  }
  async getDeliveryZonesByWarehouse(lat, lng) {
    if(!lat || !lng){
      throw new AppError("Latitude and Longitude are required", 400);
    }
    const zones = await DeliveryZoneRepository.getDeliveryZonesByWarehouse(lat, lng);
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
