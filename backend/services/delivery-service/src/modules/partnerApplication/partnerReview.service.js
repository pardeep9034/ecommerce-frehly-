import jwt from "jsonwebtoken";
import initializeModels from "../../models/index.js";
import PartnerApplicationRepository from "../repository/partnerApplication.repository.js";
import PartnerDocumentRepository from "../repository/partnerDocument.repository.js";
import PartnerApplicationCheckRepository from "../repository/partnerApplicationCheck.repository.js";
import PartnerApplicationEventRepository from "../repository/partnerApplicationEvent.repository.js";
import DeliveryPartnerRepository from "../repository/deliveryPartner.repository.js";
import DeliveryPartnerZoneRepository from "../repository/deliveryPartnerZone.repository.js";
import DeliveryStatusHistoryRepository from "../repository/deliveryStatusHistory.repository.js";
import DeliveryZoneRepository from "../repository/deliveryZone.repository.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/Logger.js";
import * as storage from "../../utils/storage.js";
import { sms } from "../../utils/notify.js";
import { maskPhone } from "../../utils/helper.js";
import { env } from "../../config/env.js";
import { untickChecks } from "./partnerApplication.service.js";
import {
  CHECK_KEYS, DOC_TYPES, QUEUE_STATUSES, SIGNED_URL_TTL, approvalGaps, approvalWarnings, canTransition, docLabel, formatDate,
  isCycle, licenceExpiryError, moveBlocker, normalizePlate, placementGaps, reapplyDate, requiredDocs, reuploadBlocker,
  reviewBlocker, safeName, tickBlocker, todayIST, verifyBlocker,
} from "./partnerApplicationRules.js";

// File links are a different kind of token from a login: this audience, a `doc` claim and no role, so one cannot stand in
// for the other (authenticateToken wants a role, the file route wants this audience).
const FILE_AUDIENCE = "partner-file";

// BIGINT columns arrive as strings; the dashboard gets numbers.
const num = (value) => (value === null || value === undefined ? null : Number(value));
const same = (a, b) => a !== null && a !== undefined && String(a) === String(b);
const inOrder = (order, key) => (x, y) => order.indexOf(x[key]) - order.indexOf(y[key]);
const zoneView = (zone) => (zone ? { id: num(zone.id), name: zone.name, is_active: zone.is_active } : null);

const parseDocType = (raw) => {
  const type = String(raw).toUpperCase();
  if (!DOC_TYPES.includes(type)) throw new AppError("Document not found", 404);
  return type;
};

// Run `work` in a transaction on the locked application, after the 404. Everything staff change goes through here, so every
// write judges the status on the row nobody else can change at that moment. Lock order is application, then documents.
const withApplication = async (id, work) => {
  const db = await initializeModels();
  return await db.sequelize.transaction(async (transaction) => {
    const application = await PartnerApplicationRepository.findByIdForUpdate(id, transaction);
    if (!application) throw new AppError("Not found", 404);
    return await work(application, transaction);
  });
};

// Why this check cannot be changed by hand now, or null. Unticking only needs the application to be under review;
// ticking also needs the evidence (see tickBlocker).
export const checkBlocker = (app, check, docs, today) => {
  if (check.check_key === "PHONE_OTP") return "Set automatically";
  const blocked = reviewBlocker(app.status);
  if (blocked) return blocked;
  return check.done ? null : tickBlocker(check.check_key, docs, today);
};

// D5: whoever created an application on someone's behalf cannot approve it.
export const isCreator = (app, user) => app.source === "ADMIN" && same(app.created_by, user.user_id);

// How every decision starts, on the locked row: the move must exist from this status (B1, B3, B5, B7), and the screen
// the reviewer decided on must still be current (A4). The 409 carries the current version for the refetch.
const decisionGuard = (application, to, expectedVersion) => {
  const blocked = moveBlocker(application.status, to);
  if (blocked) throw new AppError(blocked, 409);
  if (application.version !== expectedVersion) {
    throw new AppError("This application changed. Look at it again before deciding", 409, { version: application.version });
  }
};

// The staff detail. The server decides what is allowed (can_*, blocked_by, gaps), so the screen holds no rules.
// file_key, sha256 and number_hmac are not on the rows the repository loads, so they cannot leak from here.
export const detailView = (app, user) => {
  const today = todayIST();
  const docs = [...(app.documents ?? [])].sort(inOrder(DOC_TYPES, "type"));
  const checks = [...(app.checks ?? [])].sort(inOrder(CHECK_KEYS, "check_key"));
  const events = [...(app.events ?? [])].sort((x, y) => new Date(x.created_at) - new Date(y.created_at));

  // This reviewer's latest look at each file; what they saw on someone else's screen does not count (P2-7).
  const viewedAt = (type) =>
    events.findLast((e) => e.type === "DOC_VIEWED" && same(e.actor_id, user.user_id) && e.payload?.type === type)?.created_at ?? null;

  const gaps = approvalGaps({ app, docs, checks, today });
  const decided = ["APPROVED", "REJECTED"].includes(app.status);

  return {
    id: app.id,
    ref: `FR-P-${app.ref_no}`,
    status: app.status,
    version: app.version,
    name: app.name,
    phone: app.phone,
    email: app.email,
    vehicle_type: app.vehicle_type,
    vehicle_number: app.vehicle_number,
    preferred_zone: zoneView(app.preferredZone),
    source: app.source,
    created_by: num(app.created_by),
    submitted_at: app.submitted_at,
    reviewer_id: num(app.reviewer_id),
    review_started_at: app.review_started_at,
    documents: docs.map((d) => {
      const viewed = viewedAt(d.type);
      const verifyBlocked = verifyBlocker(app.status, d, viewed);
      return {
        type: d.type,
        status: d.status,
        mime: d.mime,
        size_bytes: d.size_bytes,
        number_masked: d.number_masked,
        expiry_date: d.expiry_date,
        reject_reason: d.reject_reason,
        uploaded_at: d.uploaded_at,
        verified_by: num(d.verified_by),
        verified_at: d.verified_at,
        viewed_by_me_at: viewed,
        can_verify: !verifyBlocked,
        verify_blocked_by: verifyBlocked?.message ?? null,
        can_reupload: !reuploadBlocker(app.status, d, viewed),
      };
    }),
    checks: checks.map((c) => {
      const blocked = checkBlocker(app, c, docs, today);
      return { key: c.check_key, done: c.done, done_by: num(c.done_by), done_at: c.done_at, note: c.note, can_tick: !blocked, blocked_by: blocked };
    }),
    gaps,
    warnings: approvalWarnings({ app, docs, today }),
    can_decide: {
      request_changes: canTransition(app.status, "CHANGES_REQUESTED", user.role),
      reject: canTransition(app.status, "REJECTED", user.role),
      approve: canTransition(app.status, "APPROVED", user.role) && !isCreator(app, user) && gaps.length === 0,
    },
    // Opening a file is logged for the audit and for P2-7; it would only bury the timeline here.
    events: events
      .filter((e) => e.type !== "DOC_VIEWED")
      .map((e) => ({
        type: e.type, actor_id: num(e.actor_id), actor_role: e.actor_role, payload: e.payload,
        visible_to_applicant: e.visible_to_applicant, created_at: e.created_at,
      })),
    decision: decided
      ? { decided_at: app.decided_at, decided_by: num(app.decided_by), reason_code: app.decision_reason, note: app.decision_note, partner_id: app.partner_id }
      : null,
  };
};

class PartnerReviewService {
  async list(filters) {
    const { rows, count } = await PartnerApplicationRepository.findQueue({
      statuses: filters.status ? [filters.status] : QUEUE_STATUSES,
      zoneId: filters.zone_id,
      source: filters.source,
      search: filters.search,
      page: filters.page,
      limit: filters.limit,
    });
    const docs = rows.length ? await PartnerDocumentRepository.findStatuses(rows.map((a) => a.id)) : [];

    const totalPages = Math.ceil(count / filters.limit);
    return {
      applications: rows.map((a) => {
        const required = requiredDocs(a.vehicle_type);
        const mine = docs.filter((d) => d.application_id === a.id);
        return {
          id: a.id,
          ref: `FR-P-${a.ref_no}`,
          status: a.status,
          name: a.name,
          phone: maskPhone(a.phone),
          vehicle_type: a.vehicle_type,
          vehicle_number: a.vehicle_number,
          preferred_zone: a.preferredZone ? { id: num(a.preferredZone.id), name: a.preferredZone.name } : null,
          source: a.source,
          submitted_at: a.submitted_at,
          reviewer_id: num(a.reviewer_id),
          // Required documents only, so "4/4" always means ready for the checks.
          documents: { verified: required.filter((t) => mine.some((d) => d.type === t && d.status === "VERIFIED")).length, required: required.length },
        };
      }),
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: filters.page,
        limit: filters.limit,
        hasNextPage: filters.page < totalPages,
        hasPrevPage: filters.page > 1,
      },
    };
  }

  async getDetail(id, user) {
    const application = await PartnerApplicationRepository.findDetail(id);
    if (!application) throw new AppError("Not found", 404);
    return detailView(application, user);
  }

  // The claim is advisory (B6): it says who is looking, it does not stop another staff member from acting.
  async startReview(id, user) {
    await withApplication(id, async (application, transaction) => {
      if (application.status === "UNDER_REVIEW") {
        // Pressed twice: already yours, nothing to write and no second event.
        if (same(application.reviewer_id, user.user_id)) return;
        throw new AppError(`Already being reviewed by staff #${application.reviewer_id}`, 409);
      }
      if (!canTransition(application.status, "UNDER_REVIEW", user.role)) {
        throw new AppError(reviewBlocker(application.status) ?? "Not allowed in this status", 409);
      }

      await PartnerApplicationRepository.transition(
        id, "NEW", { status: "UNDER_REVIEW", reviewer_id: user.user_id, review_started_at: new Date() }, { transaction }
      );
      // Visible: the applicant's timeline reads "Review started". No reviewer id in the payload.
      await PartnerApplicationEventRepository.log({ applicationId: id, type: "REVIEW_STARTED", actor: user, visible: true }, { transaction });
    });
    return this.getDetail(id, user);
  }

  // ---- documents ----

  // A short-lived link to one document's bytes. Opening it is logged: it is the audit trail, and verify needs it (P2-7).
  // `url` is a path on this API; the caller adds its own API base (the gateway), which this service does not know.
  async documentUrl(id, rawType, user) {
    const type = parseDocType(rawType);
    if (!(await PartnerApplicationRepository.findById(id))) throw new AppError("Not found", 404);
    const document = await PartnerDocumentRepository.findByType(id, type);
    if (!document) throw new AppError("Document not found", 404);

    const token = jwt.sign({ doc: document.id }, env.JWT_SECRET, { audience: FILE_AUDIENCE, expiresIn: SIGNED_URL_TTL });
    await PartnerApplicationEventRepository.log({ applicationId: id, type: "DOC_VIEWED", actor: user, payload: { type } });
    return {
      url: `/delivery-partners/applications/files/${token}`,
      expires_at: new Date(jwt.decode(token).exp * 1000).toISOString(),
    };
  }

  // The bytes behind a link. The link works any number of times for SIGNED_URL_TTL seconds, then not at all (P2-8).
  async openFile(token) {
    let claims;
    try {
      claims = jwt.verify(token, env.JWT_SECRET, { audience: FILE_AUDIENCE });
    } catch {
      throw new AppError("This link has expired", 401);
    }
    const document = typeof claims.doc === "string" ? await PartnerDocumentRepository.findFile(claims.doc) : null;
    if (!document) throw new AppError("File not found", 404);

    try {
      return { bytes: await storage.get(document.file_key), mime: document.mime };
    } catch (error) {
      if (error.code === "ENOENT") throw new AppError("File not found", 404);
      // Most likely a wrong STORAGE_KEY or a damaged file: say so in the log, nothing about it to the caller.
      logger.error(`Could not read document ${document.id}: ${error.message}`);
      throw new AppError("Could not read the file", 500);
    }
  }

  // Verifying what is already verified answers 200 and changes nothing (A6).
  async verifyDocument(id, rawType, body, user) {
    const type = parseDocType(rawType);
    await withApplication(id, async (application, transaction) => {
      const statusBlocked = reviewBlocker(application.status);
      if (statusBlocked) throw new AppError(statusBlocked, 409);
      const document = await PartnerDocumentRepository.findByType(id, type, { transaction, lock: transaction.LOCK.UPDATE });
      if (!document) throw new AppError("Document not found", 404);
      if (document.status === "VERIFIED") return;

      const viewedAt = await PartnerApplicationEventRepository.lastViewed(id, type, user.user_id, { transaction });
      const blocked = verifyBlocker(application.status, document, viewedAt);
      if (blocked) throw new AppError(blocked.message, blocked.status);

      // The licence needs a good expiry date: the reviewer's, or else the one the applicant typed.
      const values = { status: "VERIFIED", verified_by: user.user_id, verified_at: new Date(), reject_reason: null };
      if (body.expiry_date && type !== "DL") throw new AppError("Only a driving licence has an expiry date", 400);
      if (type === "DL") {
        const expiry = body.expiry_date ?? document.expiry_date;
        if (!expiry) throw new AppError("Enter the licence expiry date", 400);
        const expiryError = licenceExpiryError(expiry, todayIST());
        if (expiryError) throw new AppError(expiryError, 400);
        values.expiry_date = expiry;
      }

      await document.update(values, { transaction });
      await application.increment("version", { transaction });
      await PartnerApplicationEventRepository.log(
        { applicationId: id, type: "DOC_VERIFIED", actor: user, payload: { type, ...(values.expiry_date && { expiry_date: values.expiry_date }) } },
        { transaction }
      );
    });
    return this.getDetail(id, user);
  }

  // One bad document: send it back, and (P2-1) the application goes to CHANGES_REQUESTED in the same transaction so the
  // applicant can actually replace it. A second request finds the status already moved and gets 409 (P2-11).
  async requestReupload(id, rawType, body, user) {
    const type = parseDocType(rawType);
    const application = await withApplication(id, async (locked, transaction) => {
      const statusBlocked = reviewBlocker(locked.status);
      if (statusBlocked) throw new AppError(statusBlocked, 409);
      const document = await PartnerDocumentRepository.findByType(id, type, { transaction, lock: transaction.LOCK.UPDATE });
      if (!document) throw new AppError("Document not found", 404);

      const viewedAt = await PartnerApplicationEventRepository.lastViewed(id, type, user.user_id, { transaction });
      const blocked = reuploadBlocker(locked.status, document, viewedAt);
      if (blocked) throw new AppError(blocked, 409);

      await document.update({ status: "REJECTED", reject_reason: body.reason, verified_by: null, verified_at: null }, { transaction });
      await untickChecks(id, type, `${docLabel(type)} was sent back`, user, transaction);
      // reviewer_id stays: a resubmit returns to the same person (B6). transition() bumps the version.
      await PartnerApplicationRepository.transition(id, "UNDER_REVIEW", { status: "CHANGES_REQUESTED" }, { transaction });
      // The one timeline entry the applicant sees for this: the reviewer's own words.
      await PartnerApplicationEventRepository.log(
        { applicationId: id, type: "DOC_REJECTED", actor: user, visible: true, payload: { type, reason: body.reason } },
        { transaction }
      );
      return locked;
    });
    // After the commit; a failed text is logged inside sms() and does not undo the request.
    await sms(application.phone, "reupload", { ref: application.ref_no, doc: docLabel(type) });
    return this.getDetail(id, user);
  }

  // ---- checks and notes ----

  // Ticking needs its evidence (tickBlocker); unticking only needs the review to be open. Setting a check to the state it
  // is already in answers 200 and changes nothing (A6). PHONE_OTP is proven by the applicant's token, never by hand.
  async setCheck(id, rawKey, body, user) {
    const key = String(rawKey).toUpperCase();
    if (!CHECK_KEYS.includes(key)) throw new AppError("Check not found", 404);
    if (key === "PHONE_OTP") throw new AppError("Set automatically", 400);

    await withApplication(id, async (application, transaction) => {
      const statusBlocked = reviewBlocker(application.status);
      if (statusBlocked) throw new AppError(statusBlocked, 409);
      // Rows exist for the checks that apply to this vehicle only (a cycle has no DL_VALID or RC_MATCH).
      const check = await PartnerApplicationCheckRepository.findOne({ application_id: id, check_key: key }, { transaction });
      if (!check) throw new AppError("This check does not apply to this vehicle", 404);
      if (check.done === body.done) return;

      const note = body.note || null;
      if (body.done) {
        const docs = await PartnerDocumentRepository.findByApplication(id, { transaction });
        const unmet = tickBlocker(key, docs, todayIST());
        if (unmet) throw new AppError(unmet, 409);
        if (key === "BG_CHECK" && !note) throw new AppError("Add the background check reference", 400);
      }

      await check.update(
        body.done ? { done: true, done_by: user.user_id, done_at: new Date(), note } : { done: false, done_by: null, done_at: null, note },
        { transaction }
      );
      await application.increment("version", { transaction });
      await PartnerApplicationEventRepository.log(
        { applicationId: id, type: body.done ? "CHECK_DONE" : "CHECK_UNDONE", actor: user, payload: { key, ...(note && { note }) } },
        { transaction }
      );
    });
    return this.getDetail(id, user);
  }

  // Allowed in every status, and the applicant never sees it. It changes nothing an approver decides on, so no version bump.
  async addNote(id, body, user) {
    if (!(await PartnerApplicationRepository.findById(id))) throw new AppError("Not found", 404);
    await PartnerApplicationEventRepository.log({ applicationId: id, type: "NOTE", actor: user, payload: { text: body.text } });
    return this.getDetail(id, user);
  }

  // ---- decisions ----

  // Several problems, one text (P2-11). A document named in `items` goes back as REJECTED, so the applicant's resubmit really
  // has to replace it (F1). Applicant details (name, email...) are only listed: the applicant's own edit unticks what depends on them.
  // Straight from NEW is allowed (B2): the claim is taken here, with no REVIEW_STARTED.
  async requestChanges(id, body, user) {
    const application = await withApplication(id, async (locked, transaction) => {
      decisionGuard(locked, "CHANGES_REQUESTED", body.expected_version);

      const docs = await PartnerDocumentRepository.findByApplication(id, { transaction, lock: transaction.LOCK.UPDATE });
      for (const type of body.items.filter((item) => DOC_TYPES.includes(item))) {
        const document = docs.find((d) => d.type === type);
        if (!document) throw new AppError(`${docLabel(type)} has not been uploaded`, 400);
        await document.update({ status: "REJECTED", reject_reason: body.message, verified_by: null, verified_at: null }, { transaction });
        await untickChecks(id, type, `${docLabel(type)} was sent back`, user, transaction);
      }

      await PartnerApplicationRepository.transition(
        id, locked.status, { status: "CHANGES_REQUESTED", reviewer_id: locked.reviewer_id ?? user.user_id }, { transaction }
      );
      // Only the reviewer's words for the applicant: the message and what to fix. No reviewer id.
      await PartnerApplicationEventRepository.log(
        { applicationId: id, type: "CHANGES_REQUESTED", actor: user, visible: true, payload: { message: body.message, items: body.items } },
        { transaction }
      );
      return locked;
    });
    await sms(application.phone, "changes", { ref: application.ref_no });
    return this.getDetail(id, user);
  }

  // The reason code and note stay with staff (F3); the applicant is told a decision was made and when they may apply again.
  // A silent applicant can be closed out (P2-3), and only for that reason.
  async reject(id, body, user) {
    const decidedAt = new Date();
    const application = await withApplication(id, async (locked, transaction) => {
      decisionGuard(locked, "REJECTED", body.expected_version);
      if (locked.status === "CHANGES_REQUESTED" && body.reason_code !== "NO_RESPONSE") {
        throw new AppError("While the applicant is fixing things, the only reason to reject is No response", 400);
      }

      await PartnerApplicationRepository.transition(
        id, locked.status,
        {
          status: "REJECTED", reviewer_id: locked.reviewer_id ?? user.user_id, decided_by: user.user_id, decided_at: decidedAt,
          decision_reason: body.reason_code, decision_note: body.note,
        },
        { transaction }
      );
      await PartnerApplicationEventRepository.log({ applicationId: id, type: "REJECTED", actor: user, visible: true }, { transaction });
      return locked;
    });
    await sms(application.phone, "rejected", { ref: application.ref_no, date: formatDate(reapplyDate(decidedAt)) });
    return this.getDetail(id, user);
  }

  // One transaction: a working partner and a closed application, or nothing (E8). Every check runs before the first insert,
  // because a failed INSERT leaves a Postgres transaction unusable.
  async approve(id, body, user) {
    let partner;
    // A partner made through the direct route between our checks and the insert hits a unique index; app.js answers that 409.
    const application = await withApplication(id, async (locked, transaction) => {
      decisionGuard(locked, "APPROVED", body.expected_version);
      if (isCreator(locked, user)) throw new AppError("You created this application, so someone else has to approve it", 403);

      // Two approvals of one plate lock different application rows, so they would not wait for each other (A3).
      const plate = isCycle(locked.vehicle_type) ? null : normalizePlate(locked.vehicle_number);
      if (plate) await DeliveryPartnerRepository.lockPlate(plate, { transaction });

      // Read after the lock, so they are current.
      const docs = await PartnerDocumentRepository.findByApplication(id, { transaction });
      const checks = await PartnerApplicationCheckRepository.findAll({ application_id: id }, { transaction });
      const zone = await DeliveryZoneRepository.getDeliveryZoneById(body.zone_id, { transaction });
      const gaps = [
        ...approvalGaps({ app: locked, docs, checks, today: todayIST() }),
        ...placementGaps({
          zone,
          plateTaken: plate ? await DeliveryPartnerRepository.plateExists(plate, { transaction }) : false,
          partnerExists: Boolean(await DeliveryPartnerRepository.getDeliveryPartnerByUserId(locked.user_id, { transaction })),
        }),
      ];
      if (gaps.length) throw new AppError("Cannot approve yet", 400, gaps);

      const now = new Date();
      // The partner's zone_id is the record of the choice, which may differ from the applicant's (E2). zone_id is INTEGER here
      // and BIGINT (a string) on the zone. A cycle has no plate, so none is stored (the plate column is unique).
      partner = await DeliveryPartnerRepository.createDeliveryPartner(
        {
          user_id: locked.user_id, name: locked.name, phone: locked.phone, vehicle_type: locked.vehicle_type,
          vehicle_number: plate ? locked.vehicle_number : null, zone_id: Number(zone.id), max_active_orders: body.max_active_orders,
          status: "ACTIVE", application_id: locked.id, joined_at: now,
        },
        { transaction }
      );
      await DeliveryPartnerZoneRepository.createDeliveryPartnerZone({ delivery_partner_id: partner.id, zone_id: zone.id, is_primary: true }, { transaction });
      await DeliveryStatusHistoryRepository.createStatusHistory({ delivery_partner_id: partner.id, status: "ACTIVE", remarks: "Approved" }, { transaction });

      await PartnerApplicationRepository.transition(
        id, "UNDER_REVIEW",
        { status: "APPROVED", partner_id: partner.id, decided_by: user.user_id, decided_at: now, decision_note: body.note || null },
        { transaction }
      );
      await PartnerApplicationEventRepository.log({ applicationId: id, type: "APPROVED", actor: user, visible: true }, { transaction });
      return locked;
    });

    await sms(application.phone, "approved", { name: safeName(application.name) });
    return { ...(await this.getDetail(id, user)), partner_id: partner.id };
  }
}

export default new PartnerReviewService();
