import PartnerApplicationService from "./partnerApplication.service.js";
import ResponseUtil from "../../utils/response.js";

class PartnerApplicationController {
  async createApplication(req, res, next) {
    try {
      const result = await PartnerApplicationService.createApplication(req.user, req.body);

      return ResponseUtil.success(res, result, "Application created", 201);
    } catch (error) {
      next(error);
    }
  }

  async getMine(req, res, next) {
    try {
      const result = await PartnerApplicationService.getMine(req.user);

      return ResponseUtil.success(res, result, "Application fetched");
    } catch (error) {
      next(error);
    }
  }

  async updateMine(req, res, next) {
    try {
      const result = await PartnerApplicationService.updateMine(req.user, req.body);

      return ResponseUtil.success(res, result, "Application updated");
    } catch (error) {
      next(error);
    }
  }

  async putDocument(req, res, next) {
    try {
      const result = await PartnerApplicationService.putDocument(req.user, req.params.type, req.file, req.body);

      return ResponseUtil.success(res, result, "Document uploaded");
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(req, res, next) {
    try {
      const result = await PartnerApplicationService.deleteDocument(req.user, req.params.type);

      return ResponseUtil.success(res, result, "Document removed");
    } catch (error) {
      next(error);
    }
  }

  async submit(req, res, next) {
    try {
      const result = await PartnerApplicationService.submit(req.user);

      return ResponseUtil.success(res, result, "Application submitted");
    } catch (error) {
      next(error);
    }
  }

  async resubmit(req, res, next) {
    try {
      const result = await PartnerApplicationService.resubmit(req.user);

      return ResponseUtil.success(res, result, "Application resubmitted");
    } catch (error) {
      next(error);
    }
  }
}

export default new PartnerApplicationController();
