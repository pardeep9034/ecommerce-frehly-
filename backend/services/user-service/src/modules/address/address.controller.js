import AddressServices from "./address.services.js";
import ResponseUtil from "../../utils/response.js";

const AddressController = {
  async getAllAddresses(req, res) {
    try {
      const addresses = await AddressServices.getAllAddresses();
      return ResponseUtil.success(res, addresses);
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  },

  async getAddressById(req, res) {
    try {
      const address = await AddressServices.getAddressById(req.params.id);
      if (!address) return ResponseUtil.notFound(res, "Address not found");
      return ResponseUtil.success(res, address);
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  },

  async getAddressesByUserId(req, res) {
    try {
      const addresses = await AddressServices.getAddressesByUserId(req.params.userId);
      return ResponseUtil.success(res, addresses);
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  },

  async createAddress(req, res) {
    try {
      const address = await AddressServices.createAddress(req.body);
      return ResponseUtil.success(res, address, "Address created", 201);
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  },

  async updateAddress(req, res) {
    try {
      const updated = await AddressServices.updateAddress(req.params.id, req.body);
      if (updated[0] === 0) return ResponseUtil.notFound(res, "Address not found");
      return ResponseUtil.success(res, null, "Address updated");
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  },

  async deleteAddress(req, res) {
    try {
      const deleted = await AddressServices.deleteAddress(req.params.id);
      if (deleted === 0) return ResponseUtil.notFound(res, "Address not found");
      return ResponseUtil.success(res, null, "Address deleted");
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  },

  async setDefaultAddress(req, res) {
    try {
      const { userId } = req.body;
      const updated = await AddressServices.setDefaultAddress(req.params.id, userId);
      if (updated[0] === 0) return ResponseUtil.notFound(res, "Address not found");
      return ResponseUtil.success(res, null, "Default address set");
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  }
};

export default AddressController;
