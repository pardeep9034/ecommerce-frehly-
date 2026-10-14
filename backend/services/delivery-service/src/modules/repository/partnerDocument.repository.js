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

  async findByApplication(applicationId, options = {}) {
    return await this.findAll({ application_id: applicationId }, options);
  }

  // Type and status of every document of these applications, in one query (the queue's "2/4 verified").
  async findStatuses(applicationIds) {
    return await this.findAll({ application_id: applicationIds }, { attributes: ["application_id", "type", "status"] });
  }
}

export default new PartnerDocumentRepository();
