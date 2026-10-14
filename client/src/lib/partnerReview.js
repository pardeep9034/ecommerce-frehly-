// Labels for the staff side of partner applications. What may be done is decided by the server (can_*, gaps); only words live here.

export const APPLICATION_STATUS = {
  NEW: "New",
  UNDER_REVIEW: "Under review",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const VEHICLE_LABEL = { BIKE: "Bike", SCOOTER: "Scooter", EV_SCOOTER: "EV scooter", CYCLE: "Cycle" };

export const SOURCE_LABEL = { SELF: "Self sign-up", ADMIN: "Admin" };

export const DOC_LABEL = { PHOTO: "Profile photo", AADHAAR: "Aadhaar card", DL: "Driving licence", RC: "Vehicle RC", PAN: "PAN card" };
export const DOC_ORDER = Object.keys(DOC_LABEL);
export const DOC_STATUS = { UPLOADED: "To check", VERIFIED: "Verified", REJECTED: "Sent back" };

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

// The server stores UTC; staff read the Indian clock (I8).
export const whenIST = (iso) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "—";
