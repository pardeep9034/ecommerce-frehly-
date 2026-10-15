import auditLogService from "./auditLog.service.js";
import ResponseUtil from "../../utils/response.js";

class AuditLogController {
  async list(req, res, next) {
    try {
      const result = await auditLogService.list(req.query);
      return ResponseUtil.success(res, result, "Audit log fetched successfully");
    } catch (error) {
      return next(error);
    }
  }
}

export default new AuditLogController();
