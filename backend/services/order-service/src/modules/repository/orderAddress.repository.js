import BaseRepository from "./baseRepository.js";

class OrderAddressRepository extends BaseRepository {
  constructor() {
    super("OrderAddress");
  }

  async createOrderAddress(addressData, options = {}) {
    return await this.create(addressData, options);
  }

  async getAddressByOrderId(orderId, options = {}) {
    return await this.findOne({ order_id: orderId }, options);
  }
}

export default new OrderAddressRepository();
