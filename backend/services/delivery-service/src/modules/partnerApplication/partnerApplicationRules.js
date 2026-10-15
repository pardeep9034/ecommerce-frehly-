// Every onboarding rule that needs no database, as pure functions (DELIVERY_PARTNER_ONBOARDING_DESIGN.md §4, §5.3, §6.5).
// The applicant half comes first; the review half (state machine, checks, approval gates, dates, texts) starts at "review path".
import { ROLES, STAFF_ROLES } from "../../constants/roles.js";

export const VEHICLE_TYPES = ["BIKE", "SCOOTER", "EV_SCOOTER", "CYCLE"];
export const DOC_TYPES = ["PHOTO", "AADHAAR", "DL", "RC", "PAN"];
export const STATUSES = ["DRAFT", "NEW", "UNDER_REVIEW", "CHANGES_REQUESTED", "APPROVED", "REJECTED"];
export const CHECK_KEYS = ["PHONE_OTP", "ID_MATCH", "DL_VALID", "RC_MATCH", "BG_CHECK", "SAFETY_BRIEFING"];
export const EVENT_TYPES = [
  "CREATED", "SUBMITTED", "DOC_UPLOADED", "DOC_VIEWED", "DOC_VERIFIED", "DOC_REJECTED", "CHECK_DONE",
  "CHECK_UNDONE", "REVIEW_STARTED", "NOTE", "CHANGES_REQUESTED", "RESUBMITTED", "APPROVED", "REJECTED",
];

// The Activity log's Onboarding tab filters by these. Every event type is in exactly one group (partnerApplicationRules.check.js).
export const ACTIVITY_GROUPS = {
  flow: ["CREATED", "SUBMITTED", "RESUBMITTED"],
  docs: ["DOC_UPLOADED", "DOC_VIEWED", "DOC_VERIFIED", "DOC_REJECTED"],
  checks: ["CHECK_DONE", "CHECK_UNDONE"],
  decisions: ["REVIEW_STARTED", "NOTE", "CHANGES_REQUESTED", "APPROVED", "REJECTED"],
};
// Time windows the page offers: last hour, day, week, month.
export const ACTIVITY_HOURS = [1, 24, 168, 720];

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const REAPPLY_COOLDOWN_DAYS = 30;

// Statuses where the applicant may still change details and documents.
export const EDITABLE = ["DRAFT", "CHANGES_REQUESTED"];
// Statuses that end an application; anything else counts as the applicant's one open application.
export const FINAL = ["APPROVED", "REJECTED"];

export const isCycle = (vehicleType) => vehicleType === "CYCLE";

// A cycle has no licence, no RC and no plate.
export const requiredDocs = (vehicleType) => (isCycle(vehicleType) ? ["PHOTO", "AADHAAR"] : ["PHOTO", "AADHAAR", "DL", "RC"]);
export const optionalDocs = () => ["PAN"];
export const allowedDocs = (vehicleType) => [...requiredDocs(vehicleType), ...optionalDocs()];

export const missingDocs = (vehicleType, uploadedTypes) => requiredDocs(vehicleType).filter((type) => !uploadedTypes.includes(type));

// The checks that apply to this vehicle (§4.3): no licence or RC check for a cycle.
export const applicableChecks = (vehicleType) =>
  CHECK_KEYS.filter((key) => !(isCycle(vehicleType) && (key === "DL_VALID" || key === "RC_MATCH")));

// ---- document numbers (D8): typed by the applicant, stored masked plus a keyed hash, never in full ----

export const NUMBER_DOCS = ["AADHAAR", "DL", "PAN"];

const NUMBER_FORMAT = {
  AADHAAR: { pattern: /^\d{12}$/, hint: "12 digits" },
  DL: { pattern: /^[A-Z0-9]{8,20}$/, hint: "8 to 20 letters or digits" },
  PAN: { pattern: /^[A-Z]{5}\d{4}[A-Z]$/, hint: "like ABCDE1234F" },
};

// Returns the cleaned number, or null when it is not a valid one for this document.
export const normalizeNumber = (type, raw) => {
  const rule = NUMBER_FORMAT[type];
  const cleaned = String(raw ?? "").replace(/[\s-]/g, "").toUpperCase();
  return rule && rule.pattern.test(cleaned) ? cleaned : null;
};
export const numberHint = (type) => NUMBER_FORMAT[type]?.hint;

// Aadhaar shows its last four digits; licence and PAN show their last four characters.
export const maskNumber = (type, normalized) => {
  const last4 = normalized.slice(-4);
  return type === "AADHAAR" ? `•••• •••• ${last4}` : `••••${last4}`;
};

// ---- uploads (§6.5): the file's own first bytes decide its type, not the name or the declared mime ----

export const ALLOWED_MIMES = ["image/jpeg", "image/png", "application/pdf"];
export const EXTENSION = { "image/jpeg": "jpg", "image/png": "png", "application/pdf": "pdf" };

const startsWith = (buffer, bytes) => buffer.length >= bytes.length && bytes.every((byte, i) => buffer[i] === byte);

export const detectMime = (buffer) => {
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (startsWith(buffer, [0x25, 0x50, 0x44, 0x46])) return "application/pdf";
  return null;
};

// ---- cooldown after a rejection (§3.4) ----

// The first day a rejected person may apply again.
export const reapplyDate = (decidedAt) => new Date(new Date(decidedAt).getTime() + REAPPLY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

// ================= review path (Phase 2) =================

export const REASON_CODES = [
  "INVALID_DOCUMENTS", "ID_MISMATCH", "LICENCE_INVALID", "BG_CHECK_FAILED", "OUT_OF_AREA", "DUPLICATE", "NO_RESPONSE", "OTHER",
];
// Applicant details a reviewer may ask to have fixed, besides the documents.
export const FIELD_ITEMS = ["name", "email", "preferred_zone_id", "vehicle_number"];

export const SIGNED_URL_TTL = 120; // seconds
export const DL_WARN_DAYS = 90;
export const DL_MAX_YEARS = 40;
export const MAX_ORDERS = { min: 1, max: 10 };

const DOC_LABEL = { PHOTO: "Photo", AADHAAR: "Aadhaar", DL: "Driving licence", RC: "Vehicle RC", PAN: "PAN" };
const CHECK_LABEL = {
  PHONE_OTP: "Phone verified by OTP", ID_MATCH: "Name and photo match Aadhaar", DL_VALID: "Licence valid for two-wheeler",
  RC_MATCH: "RC matches vehicle number", BG_CHECK: "Background check cleared", SAFETY_BRIEFING: "Safety and app briefing done",
};
export const docLabel = (type) => DOC_LABEL[type] ?? type;
export const checkLabel = (key) => CHECK_LABEL[key] ?? key;

// ---- application state machine (§3.4, §4.3): from -> to -> roles allowed to make the move ----

const DECIDERS = [ROLES.ADMIN, ROLES.SUPER_ADMIN]; // approve and reject (D4)
const MOVES = {
  // Staff may submit too, but only an application they created (source ADMIN, checked by the caller, P3-4).
  DRAFT: { NEW: [ROLES.DELIVERY_PARTNER, ...STAFF_ROLES] },
  NEW: { UNDER_REVIEW: STAFF_ROLES, CHANGES_REQUESTED: STAFF_ROLES, REJECTED: DECIDERS },
  UNDER_REVIEW: { CHANGES_REQUESTED: STAFF_ROLES, APPROVED: DECIDERS, REJECTED: DECIDERS },
  // A silent applicant must be closable (P2-3), otherwise the one-open-application index locks their number for good.
  CHANGES_REQUESTED: { UNDER_REVIEW: [ROLES.DELIVERY_PARTNER], REJECTED: DECIDERS },
};
export const canTransition = (from, to, role) => MOVES[from]?.[to]?.includes(role) ?? false;

const BLOCKED_IN = {
  DRAFT: "This application has not been submitted",
  NEW: "Start the review first",
  CHANGES_REQUESTED: "Waiting for the applicant",
  APPROVED: "This application was already decided",
  REJECTED: "This application was already decided",
};
// Why a review action (verify, tick, re-upload) is refused in this status, or null when the application is under review.
export const reviewBlocker = (status) => BLOCKED_IN[status] ?? null;
// Why the move from -> to does not exist for anyone, or null when it does.
export const moveBlocker = (from, to) => (MOVES[from]?.[to] ? null : reviewBlocker(from) ?? "Not allowed in this status");

// What the staff queue shows by default: submitted and not yet decided. A DRAFT is still the applicant's own.
export const QUEUE_STATUSES = ["NEW", "UNDER_REVIEW", "CHANGES_REQUESTED"];
// Statuses a staff member may ask the queue for. DRAFT only on request (P3-10): never in the default list or the badge.
export const LISTED_STATUSES = ["DRAFT", ...QUEUE_STATUSES, "APPROVED", "REJECTED"];
// The staff's turn (P3-5): what the "Waiting for review" count and the sidebar badge show. CHANGES_REQUESTED is the applicant's turn.
export const WAITING_STATUSES = ["NEW", "UNDER_REVIEW"];

// What the stat card, the sidebar badge and the overview tile show. `rows` are countByStatus(): { status, count, oldest_submitted_at }.
// Every status is present (zero when none), and `oldest_submitted_at` is the oldest of the waiting ones, or null.
export const summarize = (rows) => {
  const by_status = Object.fromEntries(STATUSES.map((status) => [status, rows.find((r) => r.status === status)?.count ?? 0]));
  const dates = rows.filter((r) => WAITING_STATUSES.includes(r.status) && r.oldest_submitted_at).map((r) => new Date(r.oldest_submitted_at));
  return {
    waiting: WAITING_STATUSES.reduce((total, status) => total + by_status[status], 0),
    oldest_submitted_at: dates.length ? new Date(Math.min(...dates)) : null,
    by_status,
  };
};

// ---- document state machine ----

const DOC_MOVES = { UPLOADED: ["VERIFIED", "REJECTED"], VERIFIED: ["REJECTED", "UPLOADED"], REJECTED: ["UPLOADED"] };
// `from` is null for a first upload.
export const canMoveDoc = (from, to) => (from === null ? to === "UPLOADED" : DOC_MOVES[from]?.includes(to) ?? false);

// The typed number must be there before Aadhaar or a licence is verified (P2-6); PAN is optional.
const NUMBER_REQUIRED = ["AADHAAR", "DL"];
// A reviewer must have opened the current file before judging it (P2-7). `viewedAt` is their latest DOC_VIEWED for it.
const notViewed = (doc, viewedAt) => !viewedAt || new Date(viewedAt) < new Date(doc.uploaded_at);

// Why this document cannot be verified now, or null: { message, status } where status is what the route answers.
// A missing number is the request being incomplete (400); everything else is the state of the application (409).
// Verifying an already verified document is handled by the caller (a no-op, A6).
export const verifyBlocker = (appStatus, doc, viewedAt) => {
  const blocked = reviewBlocker(appStatus);
  if (blocked) return { status: 409, message: blocked };
  if (doc.status === "VERIFIED") return { status: 409, message: "Already verified" };
  if (doc.status === "REJECTED") return { status: 409, message: "Waiting for a new file" };
  if (NUMBER_REQUIRED.includes(doc.type) && !doc.number_masked) {
    return { status: 400, message: `The applicant has not entered the ${docLabel(doc.type)} number` };
  }
  return notViewed(doc, viewedAt) ? { status: 409, message: "Open the file first" } : null;
};

// Why a re-upload cannot be asked for now, or null.
export const reuploadBlocker = (appStatus, doc, viewedAt) => {
  const blocked = reviewBlocker(appStatus);
  if (blocked) return blocked;
  if (doc.status === "REJECTED") return "Waiting for a new file";
  return notViewed(doc, viewedAt) ? "Open the file first" : null;
};

// ---- checks (§4.3): what a tick needs, and what unticks it ----

const CHECK_DOCS = { ID_MATCH: ["PHOTO", "AADHAAR"], DL_VALID: ["DL"], RC_MATCH: ["RC"] }; // must be VERIFIED
const CHECK_FIELDS = { ID_MATCH: ["name"], RC_MATCH: ["vehicle_number"] }; // an applicant edit invalidates them
// `what` is a document type or an applicant field. BG_CHECK and SAFETY_BRIEFING are manual and never untick (D7).
export const checksToUntick = (what) =>
  CHECK_KEYS.filter((key) => CHECK_DOCS[key]?.includes(what) || CHECK_FIELDS[key]?.includes(what));

// Why this check cannot be ticked, or null. `docs` are the application's document rows.
export const tickBlocker = (key, docs, today) => {
  const unverified = (CHECK_DOCS[key] ?? []).filter((type) => docs.find((d) => d.type === type)?.status !== "VERIFIED");
  if (unverified.length) return `${unverified.map(docLabel).join(" and ")} must be verified first`;
  if (key === "DL_VALID") {
    const expiry = docs.find((d) => d.type === "DL").expiry_date;
    if (!expiry) return "The licence has no expiry date";
    if (expiry < today) return "The licence has expired";
  }
  return null;
};

// ---- dates: the server runs in UTC, licences expire on the Indian calendar day (C8) ----

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "YYYY-MM-DD" in IST.
export const todayIST = (now = new Date()) => new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
// Whole days from `today` to `expiry` (both "YYYY-MM-DD"); 0 means it expires today and is still valid.
export const daysUntil = (expiry, today) => Math.round((Date.parse(expiry) - Date.parse(today)) / 86400000);
// "10 Nov 2026" in IST, for texts.
export const formatDate = (date) => {
  const [y, m, d] = todayIST(new Date(date)).split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
};

// The reviewer's expiry date for a licence, or the reason it is refused (C5). `expiry` is already a valid "YYYY-MM-DD"
// (validate.js), so plain string comparison orders it correctly.
export const licenceExpiryError = (expiry, today) => {
  if (expiry < today) return "Licence has expired. Ask for a new one";
  const latest = `${Number(today.slice(0, 4)) + DL_MAX_YEARS}${today.slice(4)}`;
  if (expiry > latest) return "Licence expiry is too far ahead. Check the year";
  return null;
};

// ---- approval gates (§4.4): every gap at once, so the reviewer fixes them in one pass (E1) ----

export const approvalGaps = ({ app, docs, checks, today }) => {
  const gaps = [];
  for (const type of requiredDocs(app.vehicle_type)) {
    const doc = docs.find((d) => d.type === type);
    if (!doc) gaps.push({ code: "DOC_MISSING", doc: type, message: `${docLabel(type)} has not been uploaded` });
    else if (doc.status !== "VERIFIED") gaps.push({ code: "DOC_NOT_VERIFIED", doc: type, message: `${docLabel(type)} is not verified` });
  }
  // Rows missing for an applicable check count as not done.
  for (const key of applicableChecks(app.vehicle_type)) {
    if (!checks.find((c) => c.check_key === key)?.done) gaps.push({ code: "CHECK_NOT_DONE", check: key, message: `Check not done: ${checkLabel(key)}` });
  }
  const licence = isCycle(app.vehicle_type) ? null : docs.find((d) => d.type === "DL");
  if (licence && !licence.expiry_date) gaps.push({ code: "LICENCE_EXPIRY_MISSING", doc: "DL", message: "Licence has no expiry date" });
  else if (licence && licence.expiry_date < today) gaps.push({ code: "LICENCE_EXPIRED", doc: "DL", message: "Licence has expired" });
  return gaps;
};

// The gaps only the database can tell (E2, E4, E5): `zone` is the chosen zone row or null, the other two are booleans.
// The vehicle gap says the plate is registered, never whose it is.
export const placementGaps = ({ zone, plateTaken, partnerExists }) => [
  ...(zone?.is_active ? [] : [{ code: "ZONE_INVALID", message: "Choose an active zone" }]),
  ...(plateTaken ? [{ code: "VEHICLE_TAKEN", message: "This vehicle number is already registered" }] : []),
  ...(partnerExists ? [{ code: "PARTNER_EXISTS", message: "This person is already a delivery partner" }] : []),
];

export const approvalWarnings = ({ app, docs, today }) => {
  const licence = isCycle(app.vehicle_type) ? null : docs.find((d) => d.type === "DL");
  const days = licence?.expiry_date ? daysUntil(licence.expiry_date, today) : null;
  return days !== null && days >= 0 && days <= DL_WARN_DAYS ? [{ code: "LICENCE_EXPIRES_SOON", days }] : [];
};

// ---- duplicate documents (P3-8): the same number on another person's application warns every reviewer and never blocks ----

export const DUPLICATE_CAP = 5;
// `matches` are other people's documents with the same type and number hash, each with the application it sits on:
// { type, uploaded_at, application_id, ref_no, status, name }. The newest DUPLICATE_CAP per document type are kept.
export const duplicateWarnings = (matches) =>
  DOC_TYPES.flatMap((type) =>
    matches
      .filter((match) => match.type === type)
      .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
      .slice(0, DUPLICATE_CAP)
      .map(({ application_id, ref_no, status, name }) => ({
        code: "DUPLICATE_DOCUMENT", type, other: { application_id, ref_no, status, name },
      })));

// ---- plates (E4): "pb65 ax4412", "PB 65 AX 4412" and "PB-65-AX-4412" are one vehicle. Null for a cycle. ----
// The SQL side compares with REGEXP_REPLACE(UPPER(vehicle_number), '[\s-]', '', 'g'); keep the two in step.
export const normalizePlate = (raw) => String(raw ?? "").replace(/[\s-]/g, "").toUpperCase() || null;

// ---- texts (F6): the first name only, 30 characters at most. Anything beyond plain ASCII (Gurmukhi, Devanagari,
// curly quotes) may be refused by the DLT template check, so it becomes "Hi". ponytail: ASCII only, a subset of GSM. ----
export const safeName = (name) => {
  const first = String(name ?? "").trim().split(/\s+/)[0].slice(0, 30);
  return /^[A-Za-z0-9.'-]+$/.test(first) ? first : "Hi";
};
