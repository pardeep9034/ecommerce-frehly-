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
}

export default new InternalController();
