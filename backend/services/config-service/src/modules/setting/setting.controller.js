import settingService from "./setting.service.js";
import ResponseUtil from "../../utils/response.js";

class SettingController {
  async getAll(req, res) {
    const settings = await settingService.getAll();
    return ResponseUtil.success(res, settings, "Settings fetched successfully");
  }

  async getGroup(req, res) {
    const settings = await settingService.getGroup(req.params.group);
    return ResponseUtil.success(res, settings, "Settings fetched successfully");
  }

  async updateGroup(req, res) {
    const settings = await settingService.updateGroup(req.params.group, req.body, req.user.user_id);
    return ResponseUtil.success(res, settings, "Settings updated successfully");
  }
}

export default new SettingController();
