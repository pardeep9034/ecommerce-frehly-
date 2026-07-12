import DeliveryPartnerRepository from "../repository/deliveryPartner.repository.js";
import AppError from "../../utils/AppError.js";
import { env } from "../../config/env.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getAuthHeader = (authorization) => {
  return authorization ? { Authorization: authorization } : {};
};

class DeliveryPartnerService {
  async createDeliveryPartner(data, authorization) {
    const userId = await this.resolveUserId(data, authorization);

    if (!UUID_PATTERN.test(userId)) {
      throw new AppError("Valid auth user UUID is required", 400);
    }

    if (!data.vehicle_number) {
      throw new AppError("Vehicle number is required", 400);
    }

    if (!data.vehicle_type) {
      throw new AppError("Vehicle type is required", 400);
    }

    if (!data.max_active_orders || Number(data.max_active_orders) <= 0) {
      throw new AppError("max_active_orders must be greater than 0", 400);
    }

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

  async resolveUserId(data, authorization) {
    if (data.user_id) {
      return data.user_id;
    }

    if (data.auth_user?.uuid) {
      return data.auth_user.uuid;
    }

    if (!data.auth_user) {
      throw new AppError("user_id or auth_user is required", 400);
    }

    const authUser = await this.createAuthUser(data.auth_user, authorization);
    const user = authUser?.user || authUser;
    const uuid = user?.uuid || user?.user_uuid || user?.id;

    if (!uuid) {
      throw new AppError("Auth Service did not return a user UUID", 502);
    }

    return uuid;
  }

  async createAuthUser(authUserData, authorization) {
    const response = await fetch(`${env.AUTH_SERVICE_URL}${env.AUTH_CREATE_USER_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(authorization)
      },
      body: JSON.stringify(authUserData)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      throw new AppError(result.message || "Failed to create auth user", response.status || 502);
    }

    return result.data || result;
  }

  async getAllDeliveryPartners(limit, offset) {
    const { count, rows } = await DeliveryPartnerRepository.getAllDeliveryPartners(limit, offset);
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(count / limit);

    return {
      deliveryPartners: rows,
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
    if (data.current_latitude === undefined || data.current_longitude === undefined) {
      throw new AppError("current_latitude and current_longitude are required", 400);
    }

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
