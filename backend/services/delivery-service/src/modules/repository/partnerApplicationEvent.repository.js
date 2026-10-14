import BaseRepository from "./baseRepository.js";

class PartnerApplicationEventRepository extends BaseRepository {
  constructor() {
    super("PartnerApplicationEvent");
  }

  // Append-only: this is the only write.
  async log({ applicationId, type, actor, visible = false, payload = null }, options = {}) {
    return await this.create({
      application_id: applicationId,
      type,
      actor_id: actor.user_id,
      actor_role: actor.role,
      visible_to_applicant: visible,
      payload
    }, options);
  }

  // When this staff member last opened the file of `docType` on this application, or null (P2-7).
  async lastViewed(applicationId, docType, actorId, options = {}) {
    const event = await this.findOne(
      { application_id: applicationId, type: "DOC_VIEWED", actor_id: actorId, payload: { type: docType } },
      { order: [["created_at", "DESC"]], ...options }
    );
    return event?.created_at ?? null;
  }
}

export default new PartnerApplicationEventRepository();
