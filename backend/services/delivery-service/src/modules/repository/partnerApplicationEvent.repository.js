import { col, fn, Op } from "sequelize";
import BaseRepository from "./baseRepository.js";

class PartnerApplicationEventRepository extends BaseRepository {
  constructor() {
    super("PartnerApplicationEvent");
  }

  // The event stream across all applications, newest first (id breaks ties so pages never repeat or skip a row). `search`
  // matches the applicant's name or phone, the reference ("FR-P-1042", "P1042" or "1042"), or the exact staff id behind the event.
  async findActivity({ types, since, search, limit, offset }) {
    const where = { created_at: { [Op.gte]: since } };
    if (types) where.type = { [Op.in]: types };
    if (search) {
      // % _ and \ in the text are literal characters, not LIKE wildcards.
      const like = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
      const ref = search.match(/^(?:FR-?)?(?:P-?)?(\d{1,9})$/i);
      where[Op.or] = [
        { "$application.name$": { [Op.iLike]: like } },
        { "$application.phone$": { [Op.iLike]: like } },
        ...(ref ? [{ "$application.ref_no$": Number(ref[1]) }] : []),
        ...(/^\d{1,15}$/.test(search) ? [{ actor_id: search }] : []),
      ];
    }
    return await this.findAndCountAll(where, {
      include: [{ association: "application", attributes: ["id", "ref_no", "name", "vehicle_type", "status", "source"], required: true }],
      order: [["created_at", "DESC"], ["id", "DESC"]],
      limit,
      offset,
    });
  }

  // Whole-table figures for the Sources tab.
  async stats() {
    const Model = await this.getModel();
    const row = await Model.findOne({ attributes: [[fn("COUNT", col("id")), "total"], [fn("MAX", col("created_at")), "latest_at"]], raw: true });
    return { total: Number(row.total), latest_at: row.latest_at };
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
