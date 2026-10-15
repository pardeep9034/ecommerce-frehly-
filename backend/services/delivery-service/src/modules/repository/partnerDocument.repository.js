import { Op } from "sequelize";
import BaseRepository from "./baseRepository.js";

class PartnerDocumentRepository extends BaseRepository {
  constructor() {
    super("PartnerDocument");
  }

  // unscoped(): the default scope hides file_key, which the caller needs to read or delete the stored file.
  async findByType(applicationId, type, options = {}) {
    const Model = (await this.getModel()).unscoped();
    return await Model.findOne({ where: { application_id: applicationId, type }, ...options });
  }

  // By the document's own id, with file_key: only the signed-URL file route reads a file this way.
  async findFile(id) {
    return await (await this.getModel()).unscoped().findByPk(id);
  }

  // Other people's documents carrying the same number as one on this application (same type, same keyed hash), any status
  // of the other application, each flattened with the application it sits on. Feeds duplicateWarnings().
  // unscoped(): number_hmac is hidden by the default scope. A person's own earlier applications are not duplicates.
  async findDuplicates(applicationId, userId) {
    const Model = (await this.getModel()).unscoped();
    const mine = await Model.findAll({
      where: { application_id: applicationId, number_hmac: { [Op.ne]: null } },
      attributes: ["type", "number_hmac"],
      raw: true,
    });
    if (!mine.length) return [];

    const rows = await Model.findAll({
      where: { [Op.or]: mine.map(({ type, number_hmac }) => ({ type, number_hmac })) },
      attributes: ["type", "uploaded_at"],
      include: [{
        association: "application",
        attributes: ["id", "ref_no", "status", "name"],
        where: { user_id: { [Op.ne]: userId } },
        required: true,
      }],
    });
    return rows.map((row) => ({
      type: row.type, uploaded_at: row.uploaded_at,
      application_id: row.application.id, ref_no: row.application.ref_no, status: row.application.status, name: row.application.name,
    }));
  }

  async findByApplication(applicationId, options = {}) {
    return await this.findAll({ application_id: applicationId }, options);
  }

  // Type and status of every document of these applications, in one query (the queue's "2/4 verified").
  async findStatuses(applicationIds) {
    return await this.findAll({ application_id: applicationIds }, { attributes: ["application_id", "type", "status"] });
  }
}

export default new PartnerDocumentRepository();
