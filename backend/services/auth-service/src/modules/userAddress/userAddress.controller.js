import UserAddressService from "./userAddress.service.js";
import ResponseUtil from "../../utils/response.js";

class UserAddressController {
  async createAddress(req, res) {
    const address = await UserAddressService.createAddress(req.user.id, req.body);
    return ResponseUtil.success(res, address, "Address created", 201);
  }

  async getUserAddresses(req, res) {
    const addresses = await UserAddressService.getUserAddresses(req.user.id);
    return ResponseUtil.success(res, addresses, "Addresses fetched");
  }

  async getAddressById(req, res) {
    const address = await UserAddressService.getAddressById(req.user.id, req.params.id);
    return ResponseUtil.success(res, address, "Address fetched");
  }

  async updateAddress(req, res) {
    const address = await UserAddressService.updateAddress(req.user.id, req.params.id, req.body);
    return ResponseUtil.success(res, address, "Address updated");
  }

  async deleteAddress(req, res) {
    await UserAddressService.deleteAddress(req.user.id, req.params.id);
    return ResponseUtil.success(res, null, "Address deleted");
  }
}

export default new UserAddressController();
