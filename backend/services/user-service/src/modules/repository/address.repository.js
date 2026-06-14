import { initializeModels } from "../../models/index.js";

class AddressRepository {
  async getAllAddresses() {
    const db = await initializeModels();
    return await db.Address.findAll({
      include: [{ model: db.User, attributes: ["id", "first_name", "last_name", "email"] }],
      order: [["createdAt", "DESC"]]
    });
  }

  async getAddressById(id) {
    const db = await initializeModels();
    return await db.Address.findByPk(id, {
      include: [{ model: db.User, attributes: ["id", "first_name", "last_name", "email"] }]
    });
  }

  async getAddressesByUserId(userId) {
    const db = await initializeModels();
    return await db.Address.findAll({
      where: { userId },
      order: [["isDefault", "DESC"], ["createdAt", "DESC"]]
    });
  }

  async createAddress(addressData) {
    const db = await initializeModels();
    
    // If setting as default, unset other default addresses for this user
    if (addressData.isDefault) {
      await db.Address.update({ isDefault: false }, { where: { userId: addressData.userId } });
    }

    return await db.Address.create(addressData);
  }

  async updateAddress(id, addressData) {
    const db = await initializeModels();
    
    // If setting as default, unset other default addresses for this user
    if (addressData.isDefault) {
      const address = await db.Address.findByPk(id);
      if (address) {
        await db.Address.update({ isDefault: false }, { where: { userId: address.userId } });
      }
    }

    return await db.Address.update(addressData, { where: { id } });
  }

  async deleteAddress(id) {
    const db = await initializeModels();
    return await db.Address.destroy({ where: { id } });
  }

  async setDefaultAddress(id, userId) {
    const db = await initializeModels();
    await db.Address.update({ isDefault: false }, { where: { userId } });
    return await db.Address.update({ isDefault: true }, { where: { id, userId } });
  }
}

export default AddressRepository;
