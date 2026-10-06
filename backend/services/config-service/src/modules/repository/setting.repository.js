import initializeModels from "../../models/index.js";

class SettingRepository {
  async findAll() {
    const { Setting } = await initializeModels();
    return await Setting.findAll({ raw: true });
  }

  // Shallow-merges `patch` into the group's stored value in one statement, so two
  // admins saving different fields of the same group can't overwrite each other.
  async mergeValue(key, patch, updatedBy) {
    const { sequelize } = await initializeModels();
    const [[row]] = await sequelize.query(
      `INSERT INTO settings (key, value, updated_by, created_at, updated_at)
       VALUES (:key, CAST(:patch AS jsonb), :updatedBy, NOW(), NOW())
       ON CONFLICT (key) DO UPDATE
         SET value = settings.value || EXCLUDED.value,
             updated_by = EXCLUDED.updated_by,
             updated_at = NOW()
       RETURNING value`,
      { replacements: { key, patch: JSON.stringify(patch), updatedBy } }
    );
    return row.value;
  }
}

export default new SettingRepository();
