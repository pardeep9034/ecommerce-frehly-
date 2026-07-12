import BaseRepository from "./baseRepository.js";

class DeliveryPartnerRepository extends BaseRepository {
  constructor() {
    super("DeliveryPartner");
  }

  async createDeliveryPartner(data, options = {}) {
    return await this.create(data, options);
  }

  async getDeliveryPartnerById(id, options = {}) {
    return await this.findById(id, options);
  }

  async getDeliveryPartnerByUserId(userId, options = {}) {
    return await this.findOne({ user_id: userId }, options);
  }

  async getDeliveryPartnerByVehicleNumber(vehicleNumber, options = {}) {
    return await this.findOne({ vehicle_number: vehicleNumber }, options);
  }

  async getAllDeliveryPartners(limit = 10, offset = 0) {
    return await this.findAndCountAll({}, {
      limit,
      offset,
      order: [["created_at", "DESC"]]
    });
  }

  async updateDeliveryPartner(id, data, options = {}) {
    return await this.updateById(id, data, options);
  }
}

export default new DeliveryPartnerRepository();
