import { Op } from "sequelize";
import BaseRepository from "./baseRepository.js";
import { FINAL } from "../partnerApplication/partnerApplicationRules.js";

class PartnerApplicationRepository extends BaseRepository {
  constructor() {
    super("PartnerApplication");
  }

  // The applicant's one application that is not yet APPROVED or REJECTED.
  async findOpenByUser(userId, options = {}) {
    return await this.findOne({ user_id: userId, status: { [Op.notIn]: FINAL } }, options);
  }

  // Newest application of any status, with what the status screen shows.
  async findLatestWithDetails(userId) {
    return await this.findOne({ user_id: userId }, {
      order: [["created_at", "DESC"]],
      include: [
        { association: "documents" },
        { association: "checks" },
        { association: "events", where: { visible_to_applicant: true }, required: false }
      ]
    });
  }

  async findLatestRejected(userId) {
    return await this.findOne({ user_id: userId, status: "REJECTED" }, { order: [["decided_at", "DESC"]] });
  }

  // The staff queue: oldest submission first (id breaks ties so pages never repeat or skip a row), with the preferred zone.
  // `search` matches name or phone anywhere, and the reference ("FR-P-1042", "P1042" or "1042").
  async findQueue({ statuses, zoneId, source, search, page, limit }) {
    const where = { status: { [Op.in]: statuses } };
    if (zoneId) where.preferred_zone_id = zoneId;
    if (source) where.source = source;
    if (search) {
      // % _ and \ in the text are literal characters, not LIKE wildcards.
      const like = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
      const ref = search.match(/^(?:FR-?)?(?:P-?)?(\d{1,9})$/i);
      where[Op.or] = [
        { name: { [Op.iLike]: like } },
        { phone: { [Op.iLike]: like } },
        ...(ref ? [{ ref_no: Number(ref[1]) }] : []),
      ];
    }
    return await this.findAndCountAll(where, {
      include: [{ association: "preferredZone", attributes: ["id", "name"] }],
      order: [["submitted_at", "ASC NULLS LAST"], ["id", "ASC"]],
      limit,
      offset: (page - 1) * limit,
    });
  }

  // Everything the staff detail shows. Events come unsorted; the caller orders them.
  async findDetail(id, options = {}) {
    return await this.findById(id, {
      include: [
        { association: "preferredZone", attributes: ["id", "name", "is_active"] },
        { association: "documents" },
        { association: "checks" },
        { association: "events" },
      ],
      ...options,
    });
  }

  // Re-reads the row with SELECT ... FOR UPDATE inside `transaction`. A second transaction that locks or updates this
  // application waits here until the first commits, and the read then returns the committed row, not a stale copy.
  async findByIdForUpdate(id, transaction) {
    return await this.findById(id, { transaction, lock: transaction.LOCK.UPDATE });
  }

  // Moves the application only if it is still in `from`, so two requests cannot both win, and bumps `version` so a
  // reviewer's open screen goes stale. Returns the rows changed (0 or 1).
  async transition(id, from, data, options = {}) {
    const Model = await this.getModel();
    const [count] = await Model.update(
      { ...data, version: Model.sequelize.literal("version + 1") },
      { where: { id, status: from }, ...options }
    );
    return count;
  }
}

export default new PartnerApplicationRepository();
