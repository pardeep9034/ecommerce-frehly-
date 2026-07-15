import BaseRepository from "./baseRepository.js";

class DeliveryPartnerZoneRepository extends BaseRepository {
  constructor() {
    super("DeliveryPartnerZone");
  }

  async createDeliveryPartnerZone(data, options = {}) {
    return await this.create(data, options);
  }

  async getDeliveryPartnerZoneById(id, options = {}) {
    return await this.findById(id, {
      include: [
        { association: "deliveryPartner" },
        { association: "zone" }
      ],
      ...options
    });
  }

  async getByPartnerAndZone(deliveryPartnerId, zoneId, options = {}) {
    return await this.findOne(
      { delivery_partner_id: deliveryPartnerId, zone_id: zoneId },
      options
    );
  }

  async getAllDeliveryPartnerZones(limit = 10, offset = 0) {
    return await this.findAndCountAll({}, {
      include: [
        { association: "deliveryPartner" },
        { association: "zone" }
      ],
      limit,
      offset,
      order: [["created_at", "DESC"]]
    });
  }

  async getZonesByPartner(deliveryPartnerId, options = {}) {
    return await this.findAll(
      { delivery_partner_id: deliveryPartnerId },
      {
        include: [{ association: "zone" }],
        order: [["is_primary", "DESC"], ["created_at", "DESC"]],
        ...options
      }
    );
  }

  async clearPrimaryForPartner(deliveryPartnerId, options = {}) {
    const Model = await this.getModel();
    return await Model.update(
      { is_primary: false },
      {
        where: { delivery_partner_id: deliveryPartnerId, is_primary: true },
        ...options
      }
    );
  }

  async updateDeliveryPartnerZone(id, data, options = {}) {
    return await this.updateById(id, data, options);
  }

  async deleteDeliveryPartnerZone(id, options = {}) {
    return await this.deleteById(id, options);
  }
}

export default new DeliveryPartnerZoneRepository();
