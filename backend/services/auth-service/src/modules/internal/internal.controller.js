import internalService from "./internal.service.js";
import ResponseUtil from "../../utils/response.js";

class InternalController {
  async findOrCreatePartnerUser(req, res, next) {
    try {
      const result = await internalService.findOrCreatePartnerUser(req.body);
      return ResponseUtil.success(res, result, "Partner user ready");
    } catch (error) {
      return next(error);
    }
  }

  async getStaffNames(req, res, next) {
    try {
      const result = await internalService.getStaffNames(req.body.ids);
      return ResponseUtil.success(res, result, "Staff names");
    } catch (error) {
      return next(error);
    }
  }

  async getUserContacts(req, res, next) {
    try {
      const result = await internalService.getUserContacts(req.body);
      return ResponseUtil.success(res, result, "User contacts");
    } catch (error) {
      return next(error);
    }
  }
}

export default new InternalController();
