import crypto from "node:crypto";
import initializeModels from "../../models/index.js";
import PartnerApplicationRepository from "../repository/partnerApplication.repository.js";
import PartnerDocumentRepository from "../repository/partnerDocument.repository.js";
import PartnerApplicationCheckRepository from "../repository/partnerApplicationCheck.repository.js";
import PartnerApplicationEventRepository from "../repository/partnerApplicationEvent.repository.js";
import DeliveryPartnerRepository from "../repository/deliveryPartner.repository.js";
import DeliveryZoneRepository from "../repository/deliveryZone.repository.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/Logger.js";
import * as storage from "../../utils/storage.js";
import { sms } from "../../utils/notify.js";
import { env } from "../../config/env.js";
import {
  CHECK_KEYS, DOC_TYPES, EDITABLE, EXTENSION, NUMBER_DOCS, allowedDocs, applicableChecks, checksToUntick, isCycle, maskNumber,
  missingDocs, normalizeNumber, normalizePlate, numberHint, optionalDocs, reapplyDate, requiredDocs, todayIST,
} from "./partnerApplicationRules.js";

const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
const hmac = (value) => crypto.createHmac("sha256", env.DOC_HASH_KEY).update(value).digest("hex");

// What the applicant may see. Picked field by field: file_key, sha256, number_hmac and staff notes never leave here.
const documentView = (d) => ({
  type: d.type,
  status: d.status,
  number_masked: d.number_masked,
  expiry_date: d.expiry_date,
  reject_reason: d.reject_reason,
  uploaded_at: d.uploaded_at,
});

const applicationView = (a) => ({
  id: a.id,
  ref: `FR-P-${a.ref_no}`,
  status: a.status,
  name: a.name,
  phone: a.phone,
  email: a.email,
  preferred_zone_id: a.preferred_zone_id,
  vehicle_type: a.vehicle_type,
  vehicle_number: a.vehicle_number,
  source: a.source,
  consent_at: a.consent_at,
  submitted_at: a.submitted_at,
  required_docs: requiredDocs(a.vehicle_type),
  optional_docs: optionalDocs(),
  documents: (a.documents ?? []).map(documentView),
  // Done or not only; who ticked it and the note stay with staff.
  checks: (a.checks ?? [])
    .map((c) => ({ key: c.check_key, done: c.done }))
    .sort((x, y) => CHECK_KEYS.indexOf(x.key) - CHECK_KEYS.indexOf(y.key)),
  events: (a.events ?? [])
    .map((e) => ({ type: e.type, payload: e.payload, created_at: e.created_at }))
    .sort((x, y) => new Date(x.created_at) - new Date(y.created_at)),
  can_reapply_after: a.status === "REJECTED" ? reapplyDate(a.decided_at) : null,
});

// A cycle has no plate; every other vehicle must have one.
const vehicleNumberFor = (vehicleType, number) => {
  if (isCycle(vehicleType)) return null;
  if (!number) throw new AppError("Vehicle number is required", 400);
  return number.trim().toUpperCase();
};

const assertZone = async (zoneId) => {
  if (zoneId === undefined || zoneId === null) return;
  const zone = await DeliveryZoneRepository.getDeliveryZoneById(zoneId);
  if (!zone || !zone.is_active) throw new AppError("Choose an active delivery zone", 400);
};

// Every applicant route works on the caller's own open application, found from the token, never from an id in the URL.
const openApplication = async (user) => {
  const application = await PartnerApplicationRepository.findOpenByUser(user.user_id);
  if (!application) throw new AppError("No open application", 404);
  return application;
};

const assertEditable = (application) => {
  if (!EDITABLE.includes(application.status)) throw new AppError("This application can no longer be changed", 409);
};

// Whether this application can take a file of this type right now. Run twice: on the first read to refuse early, and
// again on the row locked in the transaction, because a reviewer may have moved the application in between.
const assertAcceptsDocument = (application, type) => {
  if (application.status === "UNDER_REVIEW") {
    throw new AppError("Your application is being reviewed. We will ask if a document needs replacing.", 409);
  }
  assertEditable(application);
  if (!allowedDocs(application.vehicle_type).includes(type)) {
    throw new AppError(`A ${application.vehicle_type.toLowerCase()} application does not need ${type}`, 400);
  }
};

// Evidence changed (a document replaced or rejected, or a detail edited): the checks that rested on it no longer hold.
// Only checks that were done are touched, and each gets a CHECK_UNDONE event. Call inside the transaction that changed it.
// `what` is a document type or an applicant field (see checksToUntick).
export const untickChecks = async (applicationId, what, because, actor, transaction) => {
  const undone = await PartnerApplicationCheckRepository.untick(applicationId, checksToUntick(what), { transaction });
  for (const key of undone) {
    await PartnerApplicationEventRepository.log(
      { applicationId, type: "CHECK_UNDONE", actor, payload: { key, because } }, { transaction }
    );
  }
};

const parseType = (raw) => {
  const type = String(raw).toUpperCase();
  if (!DOC_TYPES.includes(type)) throw new AppError("Unknown document type", 400);
  return type;
};

class PartnerApplicationService {
  async createApplication(user, data) {
    if (!user.phone) throw new AppError("Your token has no phone number", 401);

    if (await DeliveryPartnerRepository.getDeliveryPartnerByUserId(user.user_id)) {
      throw new AppError("You are already a delivery partner", 409);
    }
    if (await PartnerApplicationRepository.findOpenByUser(user.user_id)) {
      throw new AppError("You already have an open application", 409);
    }
    const rejected = await PartnerApplicationRepository.findLatestRejected(user.user_id);
    if (rejected) {
      const until = reapplyDate(rejected.decided_at);
      // The Indian calendar day, the same one the rejection text gives (B8).
      if (until > new Date()) throw new AppError(`You can apply again after ${todayIST(until)}`, 403);
    }

    const vehicleNumber = vehicleNumberFor(data.vehicle_type, data.vehicle_number);
    await assertZone(data.preferred_zone_id);

    const db = await initializeModels();
    // The partial unique index (one open application per user) settles two requests racing past the check above.
    const application = await db.sequelize.transaction(async (transaction) => {
      const created = await PartnerApplicationRepository.create({
        user_id: user.user_id,
        // The phone is the verified one from the token; the body cannot set it.
        phone: user.phone,
        name: data.name,
        email: data.email || null,
        preferred_zone_id: data.preferred_zone_id ?? null,
        vehicle_type: data.vehicle_type,
        vehicle_number: vehicleNumber,
        source: "SELF",
      }, { transaction });
      await PartnerApplicationEventRepository.log({ applicationId: created.id, type: "CREATED", actor: user }, { transaction });
      return created;
    });

    return applicationView(await application.reload());
  }

  async getMine(user) {
    const application = await PartnerApplicationRepository.findLatestWithDetails(user.user_id);
    if (!application) throw new AppError("No application yet", 404);
    return applicationView(application);
  }

  async updateMine(user, data) {
    const application = await openApplication(user);
    assertEditable(application);
    await assertZone(data.preferred_zone_id);

    const db = await initializeModels();
    await db.sequelize.transaction(async (transaction) => {
      // Lock, then judge and merge on the fresh row: a reviewer may have moved or read it since the read above.
      const locked = await PartnerApplicationRepository.findByIdForUpdate(application.id, transaction);
      assertEditable(locked);

      const vehicleType = data.vehicle_type ?? locked.vehicle_type;
      // The documents and check rows were set up for this vehicle type at submit (P2-5), so it is fixed from then on.
      if (locked.submitted_at && vehicleType !== locked.vehicle_type) {
        throw new AppError("The vehicle type cannot be changed after you have applied", 409);
      }
      const rawNumber = data.vehicle_number !== undefined ? data.vehicle_number : locked.vehicle_number;
      const vehicleNumber = vehicleNumberFor(vehicleType, rawNumber);
      const nameChanged = data.name !== undefined && data.name !== locked.name;
      const plateChanged = normalizePlate(vehicleNumber) !== normalizePlate(locked.vehicle_number);

      await locked.update({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.preferred_zone_id !== undefined && { preferred_zone_id: data.preferred_zone_id }),
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber,
        // Any change makes a reviewer's expected_version stale.
        version: locked.version + 1,
      }, { transaction });

      // A reviewer's ID_MATCH / RC_MATCH was made against the old name and plate.
      if (nameChanged) await untickChecks(application.id, "name", "The applicant changed their name", user, transaction);
      if (plateChanged) await untickChecks(application.id, "vehicle_number", "The applicant changed the vehicle number", user, transaction);
    });
    return this.getMine(user);
  }

  async putDocument(user, rawType, file, body) {
    const type = parseType(rawType);
    const application = await openApplication(user);
    
    assertAcceptsDocument(application, type);

    // Only what the caller sent is written, so replacing a file keeps the number typed earlier.
    const fields = {};
    if (body.number !== undefined) {
      if (!NUMBER_DOCS.includes(type)) throw new AppError(`${type} has no number`, 400);
      const normalized = normalizeNumber(type, body.number);
      if (!normalized) throw new AppError(`Enter a valid ${type} number (${numberHint(type)})`, 400);
      fields.number_masked = maskNumber(type, normalized);
      fields.number_hmac = hmac(normalized);
    }
    if (body.expiry_date !== undefined) {
      if (type !== "DL") throw new AppError("Only a driving licence has an expiry date", 400);
      fields.expiry_date = body.expiry_date;
    }

    const key = `applications/${application.id}/${type.toLowerCase()}-${crypto.randomUUID()}.${EXTENSION[file.mimetype]}`;
    await storage.put(key, file.buffer);

    let oldKey = null;
    try {
      const db = await initializeModels();
      await db.sequelize.transaction(async (transaction) => {
        // Lock the application row, then judge it. A reviewer's decision takes the same lock, so it commits either before
        // this read (the upload is refused below) or after this transaction (the reviewer then sees the new file).
        // The file is already stored above, so the lock is held for the database writes only.
        const locked = await PartnerApplicationRepository.findByIdForUpdate(application.id, transaction);
        assertAcceptsDocument(locked, type);
        // A reviewer who loaded the application before this upload now holds a stale expected_version.
        await locked.increment("version", { transaction });

        const values = {
          ...fields,
          file_key: key,
          mime: file.mimetype,
          size_bytes: file.size,
          sha256: sha256(file.buffer),
          // A new file starts unreviewed, even over one a reviewer had verified or rejected.
          status: "UPLOADED",
          verified_by: null,
          verified_at: null,
          reject_reason: null,
          uploaded_at: new Date(),
        };
        const existing = await PartnerDocumentRepository.findByType(application.id, type, { transaction });
        if (existing) {
          oldKey = existing.file_key;
          const wasVerified = existing.status === "VERIFIED";
          await existing.update(values, { transaction });
          // What a reviewer verified is gone, and so is whatever they ticked because of it.
          if (wasVerified) {
            await untickChecks(application.id, type, `${type} was replaced by the applicant`, user, transaction);
          }
        } else {
          await PartnerDocumentRepository.create({ application_id: application.id, type, ...values }, { transaction });
        }
        await PartnerApplicationEventRepository.log(
          { applicationId: application.id, type: "DOC_UPLOADED", actor: user, payload: { type } },
          { transaction }
        );
      });
    } catch (error) {
      await storage.remove(key).catch((e) => logger.error(`Could not remove orphan file ${key}: ${e.message}`));
      throw error;
    }

    // The old file goes only after the new row is committed, so a failure never leaves a row pointing at nothing.
    if (oldKey) await storage.remove(oldKey).catch((e) => logger.error(`Could not remove replaced file ${oldKey}: ${e.message}`));

    return documentView(await PartnerDocumentRepository.findByType(application.id, type));
  }

  async deleteDocument(user, rawType) {
    const type = parseType(rawType);
    const application = await openApplication(user);

    const db = await initializeModels();
    const fileKey = await db.sequelize.transaction(async (transaction) => {
      const locked = await PartnerApplicationRepository.findByIdForUpdate(application.id, transaction);
      if (locked.status !== "DRAFT") throw new AppError("Documents can only be removed from a draft", 409);

      const document = await PartnerDocumentRepository.findByType(application.id, type, { transaction });
      if (!document) throw new AppError("Document not found", 404);
      await document.destroy({ transaction });
      await locked.increment("version", { transaction });
      return document.file_key;
    });
    // The file goes after the commit, like a replaced one in putDocument.
    await storage.remove(fileKey).catch((e) => logger.error(`Could not remove file ${fileKey}: ${e.message}`));
    return { type };
  }

  async submit(user) {
    const application = await openApplication(user);

    const now = new Date();
    const db = await initializeModels();
    await db.sequelize.transaction(async (transaction) => {
      // Lock first, then judge: the status and the documents are read on the row nobody else can change meanwhile.
      const locked = await PartnerApplicationRepository.findByIdForUpdate(application.id, transaction);
      if (locked.status !== "DRAFT") throw new AppError("Only a draft can be submitted", 409);

      const uploaded = (await PartnerDocumentRepository.findByApplication(application.id, { transaction })).map((d) => d.type);
      const missing = missingDocs(locked.vehicle_type, uploaded);
      if (missing.length) throw new AppError(`Upload these documents first: ${missing.join(", ")}`, 400);

      // Only a DRAFT moves, so a double tap cannot seed the checks twice.
      const moved = await PartnerApplicationRepository.transition(
        application.id, "DRAFT", { status: "NEW", consent_at: now, submitted_at: now }, { transaction }
      );
      if (!moved) throw new AppError("This application was already submitted", 409);

      // PHONE_OTP is proven by the token: it only exists after the phone passed its OTP, and it carries this phone.
      const phoneProven = user.phone === locked.phone;
      await PartnerApplicationCheckRepository.createMany(
        applicableChecks(locked.vehicle_type).map((checkKey) => {
          const done = checkKey === "PHONE_OTP" && phoneProven;
          return { application_id: application.id, check_key: checkKey, done, done_by: done ? user.user_id : null, done_at: done ? now : null };
        }),
        { transaction }
      );
      await PartnerApplicationEventRepository.log(
        { applicationId: application.id, type: "SUBMITTED", actor: user, visible: true }, { transaction }
      );
    });

    // After the commit; a failed text is logged inside sms() and does not undo the submit.
    await sms(application.phone, "received", { ref: application.ref_no });
    return this.getMine(user);
  }

  async resubmit(user) {
    const application = await openApplication(user);

    const db = await initializeModels();
    await db.sequelize.transaction(async (transaction) => {
      const locked = await PartnerApplicationRepository.findByIdForUpdate(application.id, transaction);
      if (locked.status !== "CHANGES_REQUESTED") throw new AppError("Nothing to resubmit", 409);

      // Required documents only (P2-10): a rejected PAN stays on record and blocks nothing.
      const docs = await PartnerDocumentRepository.findByApplication(application.id, { transaction });
      const required = requiredDocs(locked.vehicle_type);
      const missing = missingDocs(locked.vehicle_type, docs.map((d) => d.type));
      if (missing.length) throw new AppError(`Upload these documents first: ${missing.join(", ")}`, 400);
      const rejected = docs.filter((d) => d.status === "REJECTED" && required.includes(d.type));
      if (rejected.length) throw new AppError(`Replace these documents first: ${rejected.map((d) => d.type).join(", ")}`, 400);

      // Back to UNDER_REVIEW with the same reviewer (reviewer_id is untouched), so it does not look new in the queue.
      const moved = await PartnerApplicationRepository.transition(application.id, "CHANGES_REQUESTED", { status: "UNDER_REVIEW" }, { transaction });
      if (!moved) throw new AppError("This application was already resubmitted", 409);
      await PartnerApplicationEventRepository.log(
        { applicationId: application.id, type: "RESUBMITTED", actor: user, visible: true }, { transaction }
      );
    });
    return this.getMine(user);
  }
}

export default new PartnerApplicationService();
