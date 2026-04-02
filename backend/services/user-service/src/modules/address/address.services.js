import AddressRepository from "../repository/address.repository.js";

const AddressServices = {
  async getAllAddresses() {
    return await new AddressRepository().getAllAddresses();
  },

  async getAddressById(id) {
    return await new AddressRepository().getAddressById(id);
  },

  async getAddressesByUserId(userId) {
    return await new AddressRepository().getAddressesByUserId(userId);
  },

  async createAddress(addressData) {
    return await new AddressRepository().createAddress(addressData);
  },

  async updateAddress(id, addressData) {
    return await new AddressRepository().updateAddress(id, addressData);
  },

  async deleteAddress(id) {
    return await new AddressRepository().deleteAddress(id);
  },

  async setDefaultAddress(id, userId) {
    return await new AddressRepository().setDefaultAddress(id, userId);
  }
};

export default AddressServices;
