import DeliveryPartnerZoneRepository from "../repository/deliveryPartnerZone.repository.js";
import DeliveryPartnerRepository from "../repository/deliveryPartner.repository.js";
import DeliveryZoneRepository from "../repository/deliveryZone.repository.js";
import AppError from "../../utils/AppError.js";

class DeliveryPartnerZoneService {
  async createDeliveryPartnerZone(data) {
    await this.ensurePartnerAndZoneExist(data.delivery_partner_id, data.zone_id);

    const existingAssignment = await DeliveryPartnerZoneRepository.getByPartnerAndZone(
      data.delivery_partner_id,
      data.zone_id
    );
    if (existingAssignment) {
      throw new AppError("Delivery partner is already assigned to this zone", 409);
    }

    if (data.is_primary) {
      await DeliveryPartnerZoneRepository.clearPrimaryForPartner(data.delivery_partner_id);
    }

    return await DeliveryPartnerZoneRepository.createDeliveryPartnerZone({
      delivery_partner_id: data.delivery_partner_id,
      zone_id: data.zone_id,
      is_primary: data.is_primary ?? false
    });
  }

  async getAllDeliveryPartnerZones(limit, offset) {
    const { count, rows } = await DeliveryPartnerZoneRepository.getAllDeliveryPartnerZones(
      limit,
      offset
    );
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(count / limit);

    return {
      deliveryPartnerZones: rows,
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

  async getDeliveryPartnerZoneById(id) {
    const partnerZone = await DeliveryPartnerZoneRepository.getDeliveryPartnerZoneById(id);
    if (!partnerZone) {
      throw new AppError("Delivery partner zone not found", 404);
    }

    return partnerZone;
  }

  async getZonesByPartner(deliveryPartnerId) {
    const partner = await DeliveryPartnerRepository.getDeliveryPartnerById(deliveryPartnerId);
    if (!partner) {
      throw new AppError("Delivery partner not found", 404);
    }

    return await DeliveryPartnerZoneRepository.getZonesByPartner(deliveryPartnerId);
  }

  async updateDeliveryPartnerZone(id, data) {
    const partnerZone = await this.getDeliveryPartnerZoneById(id);
    const deliveryPartnerId = data.delivery_partner_id ?? partnerZone.delivery_partner_id;
    const zoneId = data.zone_id ?? partnerZone.zone_id;

    await this.ensurePartnerAndZoneExist(deliveryPartnerId, zoneId);

    if (
      data.delivery_partner_id !== undefined ||
      data.zone_id !== undefined
    ) {
      const existingAssignment = await DeliveryPartnerZoneRepository.getByPartnerAndZone(
        deliveryPartnerId,
        zoneId
      );

      if (existingAssignment && String(existingAssignment.id) !== String(id)) {
        throw new AppError("Delivery partner is already assigned to this zone", 409);
      }
    }

    if (data.is_primary) {
      await DeliveryPartnerZoneRepository.clearPrimaryForPartner(deliveryPartnerId);
    }

    await DeliveryPartnerZoneRepository.updateDeliveryPartnerZone(id, data);
    return await this.getDeliveryPartnerZoneById(id);
  }

  async deleteDeliveryPartnerZone(id) {
    const deleted = await DeliveryPartnerZoneRepository.deleteDeliveryPartnerZone(id);
    if (!deleted) {
      throw new AppError("Delivery partner zone not found", 404);
    }

    return true;
  }

  async ensurePartnerAndZoneExist(deliveryPartnerId, zoneId) {
    const partner = await DeliveryPartnerRepository.getDeliveryPartnerById(deliveryPartnerId);
    if (!partner) {
      throw new AppError("Delivery partner not found", 404);
    }

    const zone = await DeliveryZoneRepository.getDeliveryZoneById(zoneId);
    if (!zone) {
      throw new AppError("Delivery zone not found", 404);
    }
  }
}

export default new DeliveryPartnerZoneService();
