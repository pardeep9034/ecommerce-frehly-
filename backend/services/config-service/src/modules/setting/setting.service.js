import settingRepository from "../repository/setting.repository.js";
import { schemas } from "../../middleware/validate.js";
import AppError from "../../utils/AppError.js";

// Stored rows only hold fields an admin has saved; the schema fills in the rest.
const withDefaults = (group, stored) =>
  schemas[group].validate(stored ?? {}, { stripUnknown: true }).value;

class SettingService {
  async getAll() {
    const rows = await settingRepository.findAll();
    const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));

    return Object.fromEntries(
      Object.keys(schemas).map((group) => [group, withDefaults(group, stored[group])])
    );
  }

  async getGroup(group) {
    if (!schemas[group]) throw new AppError(`Unknown settings group: ${group}`, 404);
    const row = await settingRepository.findByKey(group);
    return withDefaults(group, row?.value);
  }

  async updateGroup(group, patch, userId) {
    const merged = await settingRepository.mergeValue(group, patch, userId);
    return withDefaults(group, merged);
  }
}

export default new SettingService();
