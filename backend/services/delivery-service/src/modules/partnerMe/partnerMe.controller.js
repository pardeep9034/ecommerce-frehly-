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

  async finishPickup(req, res, next) {
    try {
      const result = await PartnerMeService.finishPickup(req.partner, req.user, req.params.id, req.body.collected);
      return ResponseUtil.success(res, result, req.body.collected ? "Return collected" : "Pickup closed");
    } catch (error) {
      return next(error);
    }
  }

  async uploadDoorPhoto(req, res, next) {
    try {
      const result = await PartnerMeService.uploadDoorPhoto(req.partner, req.params.id, req.file);
      return ResponseUtil.success(res, result, "Photo saved");
    } catch (error) {
      return next(error);
    }
  }

  async createDoorQr(req, res, next) {
    try {
      const result = await PartnerMeService.doorQr(req.partner, req.params.id, "POST", req.body);
      return ResponseUtil.success(res, result, "QR ready");
    } catch (error) {
      return next(error);
    }
  }

  async getDoorQr(req, res, next) {
    try {
      const result = await PartnerMeService.doorQr(req.partner, req.params.id, "GET");
      return ResponseUtil.success(res, result, "QR checked");
    } catch (error) {
      return next(error);
    }
  }

  async closeDoorQr(req, res, next) {
    try {
      const result = await PartnerMeService.doorQr(req.partner, req.params.id, "DELETE");
      return ResponseUtil.success(res, result, "QR closed");
    } catch (error) {
      return next(error);
    }
  }
}

export default new PartnerMeController();
