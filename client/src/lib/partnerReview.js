// Labels for the staff side of partner applications. What may be done is decided by the server (can_*, gaps); only words live here.

export const APPLICATION_STATUS = {
  DRAFT: "Draft",
  NEW: "New",
  UNDER_REVIEW: "Under review",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const PARTNER_STATUS = { ACTIVE: "Active", SUSPENDED: "Suspended", INACTIVE: "Inactive" };

export const VEHICLE_LABEL ={ BIKE: "Bike", SCOOTER: "Scooter", EV_SCOOTER: "EV scooter", CYCLE: "Cycle" };

export const SOURCE_LABEL = { SELF: "Self sign-up", ADMIN: "Admin" };

export const DOC_LABEL = { PHOTO: "Profile photo", AADHAAR: "Aadhaar card", DL: "Driving licence", RC: "Vehicle RC", PAN: "PAN card" };
export const DOC_ORDER = Object.keys(DOC_LABEL);
export const DOC_STATUS = { UPLOADED: "To check", VERIFIED: "Verified", REJECTED: "Sent back" };

// What staff type with a file when they upload for an applicant (same rules as the phone's Documents page).
export const DOC_INPUT = {
  AADHAAR: { number: "Aadhaar number (12 digits)", needsNumber: true },
  DL: { number: "Licence number", needsNumber: true, expiry: true },
  PAN: { number: "PAN number" },
};

export const CHECK_INFO = {
  PHONE_OTP: ["Phone verified by OTP", "Done automatically at sign-up"],
  ID_MATCH: ["Name and photo match Aadhaar", "Compare profile photo with ID"],
  DL_VALID: ["Driving licence valid for two-wheeler", "Check expiry and vehicle class"],
  RC_MATCH: ["RC matches vehicle number", "Compare the plate on the RC with the one entered"],
  BG_CHECK: ["Background check cleared", "Police or third-party verification"],
  SAFETY_BRIEFING: ["Safety and app briefing done", "In person or on call"],
};

export const EVENT_LABEL = {
  CREATED: "Application created", SUBMITTED: "Submitted", DOC_UPLOADED: "Document uploaded", DOC_VIEWED: "Document opened", DOC_VERIFIED: "Document verified",
  DOC_REJECTED: "Document sent back", CHECK_DONE: "Check done", CHECK_UNDONE: "Check undone", REVIEW_STARTED: "Review started",
  NOTE: "Note", CHANGES_REQUESTED: "Changes requested", RESUBMITTED: "Resubmitted", APPROVED: "Approved", REJECTED: "Rejected",
};

// The same events when staff acted for the applicant (payload.on_behalf, P3-12). The phone check ticked at the applicant's sign-up carries it too.
const ON_BEHALF_LABEL = {
  CREATED: "Created for the applicant",
  DOC_UPLOADED: "Document uploaded for the applicant",
  SUBMITTED: "Submitted for the applicant (consent attested)",
  CHECK_DONE: "Applicant signed in",
};
export const eventTitle = (e) => (e.payload?.on_behalf && ON_BEHALF_LABEL[e.type]) || EVENT_LABEL[e.type] || e.type;

// The detail after a payload: a note's text, a request's message, the document or check it is about, a reason.
export const eventText = (p) =>
  p?.text ?? p?.message ?? [p?.type && DOC_LABEL[p.type], p?.key && CHECK_INFO[p.key]?.[0], p?.reason, p?.note].filter(Boolean).join(" — ");

// No names in tokens yet (P2-4): "You" for the signed-in staff member, "Staff #12" for anyone else.
export const actorLabel = (e, me) =>
  e.actor_role === "DELIVERY_PARTNER" ? "Applicant" : e.actor_id === null ? "System" : e.actor_id === me ? "You" : `Staff #${e.actor_id}`;

// A duplicate-document warning (P3-8) in words. The screen links `w.other.application_id`.
export const duplicateText = (w) =>
  `This ${DOC_LABEL[w.type].toLowerCase()} number is also on FR-P-${w.other.ref_no} (${w.other.name}, ${(APPLICATION_STATUS[w.other.status] ?? w.other.status).toLowerCase()}).`;

// Applicant details a reviewer can ask to have fixed, besides the documents (same names as the server's FIELD_ITEMS).
export const FIELD_LABEL = { name: "Name", email: "Email", preferred_zone_id: "Preferred zone", vehicle_number: "Vehicle number" };

export const REASON_LABEL = {
  INVALID_DOCUMENTS: "Invalid documents",
  ID_MISMATCH: "ID does not match",
  LICENCE_INVALID: "Licence invalid",
  BG_CHECK_FAILED: "Background check failed",
  OUT_OF_AREA: "Out of area",
  DUPLICATE: "Duplicate application",
  NO_RESPONSE: "No response from applicant",
  OTHER: "Other",
};

// "3 hours", "2 days": how long ago, for the oldest waiting application.
export const waitingFor = (iso) => {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "under an hour";
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${Math.floor(hours / 24)} days`;
};

// The server stores UTC; staff read the Indian clock (I8).
export const whenIST = (iso) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "—";
