import PartnerMeService from "./partnerMe.service.js";
import ResponseUtil from "../../utils/response.js";

// Every method works for req.partner, the row requireActivePartner found from the token. No id from the client picks the partner.
class PartnerMeController {
  async getMe(req, res, next) {
    try {
      const result = await PartnerMeService.getMe(req.partner);
      return ResponseUtil.success(res, result, "Profile fetched");
    } catch (error) {
      return next(error);
    }
  }

  async listAssignments(req, res, next) {
    try {
      const result = await PartnerMeService.listAssignments(req.partner, req.filters);
      return ResponseUtil.success(res, result, "Assignments fetched");
    } catch (error) {
      return next(error);
    }
  }

  async getAssignment(req, res, next) {
    try {
      const result = await PartnerMeService.getAssignment(req.partner, req.params.id);
      return ResponseUtil.success(res, result, "Assignment fetched");
    } catch (error) {
      return next(error);
    }
  }
  async listHandovers(req, res, next) {
    try {
      const result = await PartnerMeService.listHandovers(req.partner, req.filters.dir);
      return ResponseUtil.success(res, result, "Handovers fetched");
    } catch (error) {
      return next(error);
    }
  }

  async handoverCandidates(req, res, next) {
    try {
      const result = await PartnerMeService.handoverCandidates(req.partner, req.filters.assignment_id);
      return ResponseUtil.success(res, result, "Partners fetched");
    } catch (error) {
      return next(error);
    }
  }

  async setOnlineStatus(req, res, next) {
    try {
      const result = await PartnerMeService.setOnlineStatus(req.partner.id, req.body.online);
      return ResponseUtil.success(res, result, "Online status updated");
    } catch (error) {
      return next(error);
    }
  }

  async updateAssignmentStatus(req, res, next) {
    try {
      const result = await PartnerMeService.updateAssignmentStatus(req.partner, req.user, req.params.id, req.body);
      return ResponseUtil.success(res, result, "Assignment updated");
    } catch (error) {
      return next(error);
    }
  }
}

export default new PartnerMeController();
