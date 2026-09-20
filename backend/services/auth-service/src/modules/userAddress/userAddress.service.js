import UserAddressRepository from "../repository/userAddress.repository.js";
import AppError from "../../utils/AppError.js";

class UserAddressService {
  async createAddress(userId, data) {
    if (data.is_default) {
      await UserAddressRepository.clearDefaultForUser(userId);
    }

    return await UserAddressRepository.create({
      ...data,
      user_id: userId,
      is_default: data.is_default ?? false,
      is_active: data.is_active ?? true
    });
  }

  async getUserAddresses(userId) {
    const { rows } = await UserAddressRepository.findByUserId(userId);
    return rows;
  }

  async getAddressById(userId, addressId) {
    const address = await UserAddressRepository.findByIdAndUserId(addressId, userId);

    if (!address) {
      throw new AppError("Address not found", 404);
    }

    return address;
  }

  async updateAddress(userId, addressId, data) {
    await this.getAddressById(userId, addressId);

    if (data.is_default) {
      await UserAddressRepository.clearDefaultForUser(userId);
    }

    await UserAddressRepository.updateByIdAndUserId(addressId, userId, data);
    return await this.getAddressById(userId, addressId);
  }

  async deleteAddress(userId, addressId) {
    const deleted = await UserAddressRepository.deleteByIdAndUserId(addressId, userId);

    if (!deleted) {
      throw new AppError("Address not found", 404);
    }

    return true;
  }
}

export default new UserAddressService();
