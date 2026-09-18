import AddressServices from "./address.service.js";
import ResponseUtil from "../../utils/response.js";

const AddressController = {
  async getAllAddresses(req, res, next) {
    try {
      const addresses = await AddressServices.getAllAddresses();
      return ResponseUtil.success(res, addresses);
    } catch (error) {
      next(error);
    }
  },

  async getAddressById(req, res, next) {
    try {
      const address = await AddressServices.getAddressById(req.params.id);
      return ResponseUtil.success(res, address);
    } catch (error) {
      next(error);
    }
  },

  async getAddressesByUserId(req, res, next) {
    try {
      const addresses = await AddressServices.getAddressesByUserId(req.params.userId);
      return ResponseUtil.success(res, addresses);
    } catch (error) {
      next(error);
    }
  },

  async createAddress(req, res, next) {
    try {
      const address = await AddressServices.createAddress(req.body);
      return ResponseUtil.success(res, address, "Address created", 201);
    } catch (error) {
      next(error);
    }
  },

  async updateAddress(req, res, next) {
    try {
      await AddressServices.updateAddress(req.params.id, req.body);
      return ResponseUtil.success(res, null, "Address updated");
    } catch (error) {
      next(error);
    }
  },

  async deleteAddress(req, res, next) {
    try {
      await AddressServices.deleteAddress(req.params.id);
      return ResponseUtil.success(res, null, "Address deleted");
    } catch (error) {
      next(error);
    }
  },

  async setDefaultAddress(req, res, next) {
    try {
      const { userId } = req.body;
      await AddressServices.setDefaultAddress(req.params.id, userId);
      return ResponseUtil.success(res, null, "Default address set");
    } catch (error) {
      next(error);
    }
  }
};

export default AddressController;
