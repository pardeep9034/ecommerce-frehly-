import adminUserService from "./adminUser.service.js";
import ResponseUtil from "../../utils/response.js";

class AdminUserController {
  async listCustomers(req, res, next) {
    try {
      const result = await adminUserService.listCustomers(req.query);
      return ResponseUtil.success(res, result, "Customers fetched successfully");
    } catch (error) {
      return next(error);
    }
  }

  async setCustomerStatus(req, res, next) {
    try {
      const result = await adminUserService.setCustomerStatus(req.params.id, req.body?.is_active, req.user.id);
      return ResponseUtil.success(res, result, result.is_active ? "Customer unblocked" : "Customer blocked");
    } catch (error) {
      return next(error);
    }
  }
}

export default new AdminUserController();
