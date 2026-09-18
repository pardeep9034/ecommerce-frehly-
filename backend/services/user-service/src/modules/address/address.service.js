import AddressRepository from "../repository/address.repository.js";
import AppError from "../../utils/AppError.js";

const AddressServices = {
  async getAllAddresses() {
    return await new AddressRepository().getAllAddresses();
  },

  async getAddressById(id) {
    const address = await new AddressRepository().getAddressById(id);
    if (!address) {
      throw new AppError("Address not found", 404);
    }
    return address;
  },

  async getAddressesByUserId(userId) {
    return await new AddressRepository().getAddressesByUserId(userId);
  },

  async createAddress(addressData) {
    return await new AddressRepository().createAddress(addressData);
  },

  async updateAddress(id, addressData) {
    const updated = await new AddressRepository().updateAddress(id, addressData);
    if (updated[0] === 0) {
      throw new AppError("Address not found", 404);
    }
    return updated;
  },

  async deleteAddress(id) {
    const deleted = await new AddressRepository().deleteAddress(id);
    if (deleted === 0) {
      throw new AppError("Address not found", 404);
    }
    return deleted;
  },

  async setDefaultAddress(id, userId) {
    const updated = await new AddressRepository().setDefaultAddress(id, userId);
    if (updated[0] === 0) {
      throw new AppError("Address not found", 404);
    }
    return updated;
  }
};

export default AddressServices;
