import DeliveryPartnerRepository from "../repository/deliveryPartner.repository.js";
import DeliveryPartnerZoneRepository from "../repository/deliveryPartnerZone.repository.js";
import { Op, Sequelize } from "sequelize";
import AppError from "../../utils/AppError.js";

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
    const partner =
    await DeliveryPartnerRepository.findOne({
        status: "ACTIVE",
        zone_id: zoneId,
        current_active_orders: {
            [Op.lt]: Sequelize.col("max_active_orders")
        },
        order: [
            ["current_active_orders", "ASC"]
        ]
    });
    return partner; 
    
  }
  async getAvalableDeliveryPartners(warehouseId) {
    const response = await fetch(`http://localhost:3003/warehouses/${warehouseId}`);

    const zoneId =response.data.data.zone_id
    const partners=await this.getAllDeliveryPartnersByZoneId(zoneId);
    if (!partners || partners.length === 0) {
      throw new AppError("No active delivery partners available in the zone", 404);
    }

 const riderWithDistance =partners.map(partner=>{
     const distance = calculateDistance(response.data.data.latitude,response.data.data.longitude, partner.current_latitude, partner.current_longitude);
     return {...partner, distance};
 }) 
 return riderWithDistance.sort((a, b) => a.distance - b.distance);

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
