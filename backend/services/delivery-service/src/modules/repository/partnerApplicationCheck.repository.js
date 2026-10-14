import BaseRepository from "./baseRepository.js";

class PartnerApplicationCheckRepository extends BaseRepository {
  constructor() {
    super("PartnerApplicationCheck");
  }

  async createMany(rows, options = {}) {
    const Model = await this.getModel();
    return await Model.bulkCreate(rows, options);
  }

  // Un-ticks the checks in `keys` that are done, and returns the keys that really changed (so the caller logs only those).
  async untick(applicationId, keys, options = {}) {
    if (!keys.length) return [];
    const Model = await this.getModel();
    const [, rows] = await Model.update(
      { done: false, done_by: null, done_at: null },
      { where: { application_id: applicationId, check_key: keys, done: true }, returning: true, ...options }
    );
    return rows.map((row) => row.check_key);
  }
}

export default new PartnerApplicationCheckRepository();
