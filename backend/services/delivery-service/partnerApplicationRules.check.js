// Run: node partnerApplicationRules.check.js   (no database, no running service)
import assert from "node:assert/strict";
import {
  requiredDocs, allowedDocs, missingDocs, applicableChecks, normalizeNumber, maskNumber, detectMime, reapplyDate,
  canTransition, moveBlocker, reviewBlocker, canMoveDoc, checksToUntick, tickBlocker, todayIST, daysUntil, formatDate,
  licenceExpiryError, approvalGaps, approvalWarnings, normalizePlate, safeName, STATUSES, REASON_CODES,
  verifyBlocker, reuploadBlocker, QUEUE_STATUSES, LISTED_STATUSES, placementGaps,
} from "./src/modules/partnerApplication/partnerApplicationRules.js";

// required documents per vehicle
assert.deepEqual(requiredDocs("BIKE"), ["PHOTO", "AADHAAR", "DL", "RC"]);
assert.deepEqual(requiredDocs("CYCLE"), ["PHOTO", "AADHAAR"]);
assert.ok(allowedDocs("CYCLE").includes("PAN") && !allowedDocs("CYCLE").includes("DL"), "a cycle takes PAN but no licence");
assert.deepEqual(missingDocs("BIKE", ["PHOTO", "AADHAAR", "PAN"]), ["DL", "RC"], "PAN does not count as required");
assert.deepEqual(missingDocs("CYCLE", ["PHOTO", "AADHAAR"]), []);

// checks seeded at submit
assert.equal(applicableChecks("BIKE").length, 6);
assert.deepEqual(applicableChecks("CYCLE"), ["PHONE_OTP", "ID_MATCH", "BG_CHECK", "SAFETY_BRIEFING"]);

// document numbers: cleaned, validated, masked
assert.equal(normalizeNumber("AADHAAR", "1234 5678 4412"), "123456784412");
assert.equal(normalizeNumber("AADHAAR", "1234 5678 441"), null, "11 digits");
assert.equal(normalizeNumber("PAN", "abcde-1234f"), "ABCDE1234F");
assert.equal(normalizeNumber("PAN", "ABCDE12345"), null);
assert.equal(normalizeNumber("DL", "pb65 20150012345"), "PB6520150012345");
assert.equal(normalizeNumber("PHOTO", "123"), null, "a photo has no number");
assert.equal(maskNumber("AADHAAR", "123456784412"), "•••• •••• 4412");
assert.equal(maskNumber("PAN", "ABCDE1234F"), "••••234F");
assert.ok(!maskNumber("AADHAAR", "123456784412").includes("1234"), "mask hides all but the last four");

// file signature: the bytes decide, not the name
assert.equal(detectMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0])), "image/jpeg");
assert.equal(detectMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d])), "image/png");
assert.equal(detectMime(Buffer.from("%PDF-1.7")), "application/pdf");
assert.equal(detectMime(Buffer.from("MZ\x90\x00")), null, "an .exe renamed to .jpg");
assert.equal(detectMime(Buffer.alloc(0)), null, "empty file");

// cooldown
assert.equal(reapplyDate("2026-10-01T00:00:00Z").toISOString().slice(0, 10), "2026-10-31");

// ---- Phase 2 (plan: "State rules", "Checks and what they depend on", edge cases B, C, D, E, F) ----

// application transitions: every pair, every role. Allowed pairs are listed; everything else must be refused.
const STAFF = ["ADMIN", "SUPER_ADMIN", "OPS_STAFF"], DECIDERS = ["ADMIN", "SUPER_ADMIN"], APPLICANT = ["DELIVERY_PARTNER"];
const ALLOWED = [
  ["DRAFT", "NEW", APPLICANT], ["NEW", "UNDER_REVIEW", STAFF], ["NEW", "CHANGES_REQUESTED", STAFF], ["NEW", "REJECTED", DECIDERS],
  ["UNDER_REVIEW", "CHANGES_REQUESTED", STAFF], ["UNDER_REVIEW", "APPROVED", DECIDERS], ["UNDER_REVIEW", "REJECTED", DECIDERS],
  ["CHANGES_REQUESTED", "UNDER_REVIEW", APPLICANT], ["CHANGES_REQUESTED", "REJECTED", DECIDERS],
];
for (const from of STATUSES) {
  for (const to of STATUSES) {
    for (const role of [...STAFF, ...APPLICANT, "CUSTOMER"]) {
      const rule = ALLOWED.find(([f, t]) => f === from && t === to);
      assert.equal(canTransition(from, to, role), !!rule && rule[2].includes(role), `${from} -> ${to} as ${role}`);
    }
  }
}
assert.equal(canTransition("UNDER_REVIEW", "APPROVED", "OPS_STAFF"), false, "D4: ops staff cannot approve");
assert.equal(canTransition("CHANGES_REQUESTED", "REJECTED", "ADMIN"), true, "P2-3: a silent applicant can be closed out");
assert.equal(canTransition("APPROVED", "REJECTED", "SUPER_ADMIN"), false, "B7: final means final");

// B3: the sentence for each wrong status
assert.equal(reviewBlocker("UNDER_REVIEW"), null);
assert.equal(reviewBlocker("NEW"), "Start the review first");
assert.equal(reviewBlocker("CHANGES_REQUESTED"), "Waiting for the applicant");
assert.equal(reviewBlocker("DRAFT"), "This application has not been submitted");
assert.equal(reviewBlocker("APPROVED"), "This application was already decided");
assert.equal(moveBlocker("NEW", "APPROVED"), "Start the review first", "B1");
assert.equal(moveBlocker("CHANGES_REQUESTED", "CHANGES_REQUESTED"), "Waiting for the applicant", "B5: request changes twice");
assert.equal(moveBlocker("NEW", "CHANGES_REQUESTED"), null);

// document moves
assert.ok(canMoveDoc(null, "UPLOADED") && !canMoveDoc(null, "VERIFIED"), "a first upload is UPLOADED");
assert.ok(canMoveDoc("UPLOADED", "VERIFIED") && canMoveDoc("UPLOADED", "REJECTED"));
assert.ok(canMoveDoc("VERIFIED", "REJECTED"), "C10: un-verify is a re-upload request");
assert.ok(!canMoveDoc("REJECTED", "VERIFIED"), "a rejected file must be replaced before it can be verified");
assert.ok(canMoveDoc("REJECTED", "UPLOADED") && canMoveDoc("VERIFIED", "UPLOADED"));

// D2, D7: what a changed document or field unticks; manual checks never
assert.deepEqual(checksToUntick("PHOTO"), ["ID_MATCH"]);
assert.deepEqual(checksToUntick("AADHAAR"), ["ID_MATCH"]);
assert.deepEqual(checksToUntick("DL"), ["DL_VALID"]);
assert.deepEqual(checksToUntick("RC"), ["RC_MATCH"]);
assert.deepEqual(checksToUntick("PAN"), []);
assert.deepEqual(checksToUntick("name"), ["ID_MATCH"]);
assert.deepEqual(checksToUntick("vehicle_number"), ["RC_MATCH"]);
assert.deepEqual(checksToUntick("email"), []);

// D1: a tick needs its evidence. Rows are { type, status, expiry_date }.
const doc = (type, status, expiry_date = null) => ({ type, status, expiry_date });
const TODAY = "2026-10-11";
assert.equal(tickBlocker("SAFETY_BRIEFING", [], TODAY), null, "nothing needed");
assert.equal(tickBlocker("BG_CHECK", [], TODAY), null, "the note rule is the service's");
assert.equal(tickBlocker("ID_MATCH", [doc("PHOTO", "VERIFIED"), doc("AADHAAR", "UPLOADED")], TODAY), "Aadhaar must be verified first");
assert.equal(tickBlocker("ID_MATCH", [], TODAY), "Photo and Aadhaar must be verified first", "missing rows count as unverified");
assert.equal(tickBlocker("ID_MATCH", [doc("PHOTO", "VERIFIED"), doc("AADHAAR", "REJECTED")], TODAY), "Aadhaar must be verified first");
assert.equal(tickBlocker("ID_MATCH", [doc("PHOTO", "VERIFIED"), doc("AADHAAR", "VERIFIED")], TODAY), null);
assert.equal(tickBlocker("RC_MATCH", [doc("RC", "UPLOADED")], TODAY), "Vehicle RC must be verified first");
assert.equal(tickBlocker("DL_VALID", [doc("DL", "VERIFIED")], TODAY), "The licence has no expiry date");
assert.equal(tickBlocker("DL_VALID", [doc("DL", "VERIFIED", "2026-10-10")], TODAY), "The licence has expired");
assert.equal(tickBlocker("DL_VALID", [doc("DL", "VERIFIED", TODAY)], TODAY), null, "C8: valid through the expiry day");

// C8: the container runs in UTC, the licence day is the Indian one (IST = UTC+5:30, so the date turns at 18:30 UTC)
assert.equal(todayIST(new Date("2026-10-11T18:29:00Z")), "2026-10-11");
assert.equal(todayIST(new Date("2026-10-11T18:31:00Z")), "2026-10-12");
assert.equal(formatDate("2026-10-31T18:31:00Z"), "1 Nov 2026", "texts use the IST day");
assert.equal(formatDate(reapplyDate("2026-10-01T00:00:00Z")), "31 Oct 2026");

// C5: the reviewer's expiry date
assert.equal(licenceExpiryError("2026-10-10", TODAY), "Licence has expired. Ask for a new one");
assert.equal(licenceExpiryError(TODAY, TODAY), null, "today is still valid");
assert.equal(licenceExpiryError("2066-10-11", TODAY), null, "exactly 40 years ahead");
assert.equal(licenceExpiryError("2066-10-12", TODAY), "Licence expiry is too far ahead. Check the year");
assert.equal(licenceExpiryError("2099-01-01", TODAY), "Licence expiry is too far ahead. Check the year", "a typo such as 2099");
// (a malformed date such as 20255-01-01 or 2026-02-31 never gets here: validate.js refuses it, proved in the live check)

// E1: approval gaps, all at once. A bike needs four documents and six checks.
const allDocs = () => [doc("PHOTO", "VERIFIED"), doc("AADHAAR", "VERIFIED"), doc("DL", "VERIFIED", "2030-01-01"), doc("RC", "VERIFIED")];
const allChecks = (keys) => keys.map((check_key) => ({ check_key, done: true }));
const bike = { vehicle_type: "BIKE" }, cycle = { vehicle_type: "CYCLE" };
const gapCodes = (input) => approvalGaps({ today: TODAY, ...input }).map((g) => g.code);
assert.deepEqual(gapCodes({ app: bike, docs: allDocs(), checks: allChecks(applicableChecks("BIKE")) }), [], "nothing missing");
assert.deepEqual(gapCodes({ app: bike, docs: [], checks: [] }), [
  "DOC_MISSING", "DOC_MISSING", "DOC_MISSING", "DOC_MISSING",
  "CHECK_NOT_DONE", "CHECK_NOT_DONE", "CHECK_NOT_DONE", "CHECK_NOT_DONE", "CHECK_NOT_DONE", "CHECK_NOT_DONE",
], "everything missing is listed at once, and a missing check row counts as not done");
assert.deepEqual(gapCodes({ app: bike, docs: [doc("PHOTO", "UPLOADED"), ...allDocs().slice(1)], checks: allChecks(applicableChecks("BIKE")) }), ["DOC_NOT_VERIFIED"]);
assert.deepEqual(gapCodes({ app: bike, docs: [...allDocs().slice(0, 2), doc("DL", "VERIFIED"), allDocs()[3]], checks: allChecks(applicableChecks("BIKE")) }), ["LICENCE_EXPIRY_MISSING"]);
assert.deepEqual(gapCodes({ app: bike, docs: [...allDocs().slice(0, 2), doc("DL", "VERIFIED", "2026-10-10"), allDocs()[3]], checks: allChecks(applicableChecks("BIKE")) }), ["LICENCE_EXPIRED"], "C6: expired after verify");
assert.deepEqual(gapCodes({ app: bike, docs: allDocs(), checks: allChecks(applicableChecks("BIKE")).map((c) => (c.check_key === "BG_CHECK" ? { ...c, done: false } : c)) }), ["CHECK_NOT_DONE"]);
// a cycle: no licence, RC or two of the checks, and a PAN is never required
assert.deepEqual(gapCodes({ app: cycle, docs: [doc("PHOTO", "VERIFIED"), doc("AADHAAR", "VERIFIED")], checks: allChecks(applicableChecks("CYCLE")) }), []);
assert.deepEqual(gapCodes({ app: cycle, docs: [doc("PHOTO", "VERIFIED"), doc("AADHAAR", "VERIFIED"), doc("PAN", "REJECTED")], checks: allChecks(applicableChecks("CYCLE")) }), [], "C4: a rejected PAN blocks nothing");
assert.equal(approvalGaps({ app: bike, docs: [], checks: [], today: TODAY })[0].message, "Photo has not been uploaded");
// E2, E4, E5: the gaps only the database can tell. A missing or inactive zone is the same gap.
const placed = (input) => placementGaps({ zone: { is_active: true }, plateTaken: false, partnerExists: false, ...input }).map((g) => g.code);
assert.deepEqual(placed({}), []);
assert.deepEqual(placed({ zone: null }), ["ZONE_INVALID"], "zone not found");
assert.deepEqual(placed({ zone: { is_active: false } }), ["ZONE_INVALID"], "zone deactivated after the page loaded");
assert.deepEqual(placed({ zone: null, plateTaken: true, partnerExists: true }), ["ZONE_INVALID", "VEHICLE_TAKEN", "PARTNER_EXISTS"], "all at once");

// C7: the 90-day warning at the boundary, never for a cycle, never for a licence that has expired
const warn = (expiry) => approvalWarnings({ app: bike, docs: [doc("DL", "VERIFIED", expiry)], today: TODAY });
assert.equal(daysUntil("2027-01-09", TODAY), 90);
assert.deepEqual(warn("2027-01-08"), [{ code: "LICENCE_EXPIRES_SOON", days: 89 }]);
assert.deepEqual(warn("2027-01-09"), [{ code: "LICENCE_EXPIRES_SOON", days: 90 }]);
assert.deepEqual(warn("2027-01-10"), [], "day 91");
assert.deepEqual(warn(TODAY), [{ code: "LICENCE_EXPIRES_SOON", days: 0 }], "expires today");
assert.deepEqual(warn("2026-10-10"), [], "already expired is a gap, not a warning");
assert.deepEqual(approvalWarnings({ app: cycle, docs: [doc("DL", "VERIFIED", TODAY)], today: TODAY }), []);

// E4: one vehicle, however it is typed
assert.equal(normalizePlate("pb65 ax4412"), "PB65AX4412");
assert.equal(normalizePlate("PB 65 AX 4412"), "PB65AX4412");
assert.equal(normalizePlate("pb-65-ax-4412"), "PB65AX4412");
assert.equal(normalizePlate(null), null, "a cycle has no plate");
assert.equal(normalizePlate("  "), null);

// F6: names in texts
assert.equal(safeName("Ravi Kumar"), "Ravi");
assert.equal(safeName("  O'Neil  Singh"), "O'Neil");
assert.equal(safeName("ਰਵੀ ਕੁਮਾਰ"), "Hi", "Gurmukhi");
assert.equal(safeName("रवि"), "Hi", "Devanagari");
assert.equal(safeName("José"), "Hi", "outside plain ASCII");
assert.equal(safeName("A".repeat(40)), "A".repeat(30), "cut to 30 characters");
assert.equal(safeName(""), "Hi");
assert.equal(safeName(null), "Hi");

// P2-12: the reason list the plan fixes
assert.deepEqual(REASON_CODES, ["INVALID_DOCUMENTS", "ID_MISMATCH", "LICENCE_INVALID", "BG_CHECK_FAILED", "OUT_OF_AREA", "DUPLICATE", "NO_RESPONSE", "OTHER"]);

// ---- queue statuses, and what stops verify / re-upload on one document (P2-6, P2-7) ----
assert.deepEqual(QUEUE_STATUSES, ["NEW", "UNDER_REVIEW", "CHANGES_REQUESTED"]);
assert.ok(!LISTED_STATUSES.includes("DRAFT") && LISTED_STATUSES.includes("APPROVED") && LISTED_STATUSES.includes("REJECTED"));
{
  const uploaded = new Date("2026-10-12T10:00:00Z");
  const doc = (over = {}) => ({ type: "DL", status: "UPLOADED", number_masked: "••••2345", uploaded_at: uploaded, ...over });
  const after = new Date("2026-10-12T10:05:00Z");
  const before = new Date("2026-10-12T09:59:00Z");

  assert.equal(verifyBlocker("UNDER_REVIEW", doc(), after), null, "viewed after the upload: ready");
  const msg = (blocker) => blocker && `${blocker.status} ${blocker.message}`;
  assert.equal(msg(verifyBlocker("UNDER_REVIEW", doc(), null)), "409 Open the file first", "never opened");
  assert.equal(msg(verifyBlocker("UNDER_REVIEW", doc(), before)), "409 Open the file first", "opened the previous file, not this one");
  assert.equal(msg(verifyBlocker("UNDER_REVIEW", doc({ number_masked: null }), after)), "400 The applicant has not entered the Driving licence number");
  assert.equal(msg(verifyBlocker("UNDER_REVIEW", doc({ type: "AADHAAR", number_masked: null }), after)), "400 The applicant has not entered the Aadhaar number");
  assert.equal(verifyBlocker("UNDER_REVIEW", doc({ type: "PAN", number_masked: null }), after), null, "PAN is optional, so is its number");
  assert.equal(verifyBlocker("UNDER_REVIEW", doc({ type: "PHOTO", number_masked: null }), after), null, "a photo has no number");
  assert.equal(msg(verifyBlocker("UNDER_REVIEW", doc({ status: "VERIFIED" }), after)), "409 Already verified");
  assert.equal(msg(verifyBlocker("UNDER_REVIEW", doc({ status: "REJECTED" }), after)), "409 Waiting for a new file");
  // the application's status comes first, with the B3 sentences
  assert.equal(msg(verifyBlocker("NEW", doc(), after)), "409 Start the review first");
  assert.equal(msg(verifyBlocker("NEW", doc({ number_masked: null }), null)), "409 Start the review first", "status before number before viewing");
  assert.equal(msg(verifyBlocker("CHANGES_REQUESTED", doc(), after)), "409 Waiting for the applicant");
  assert.equal(msg(verifyBlocker("APPROVED", doc(), after)), "409 This application was already decided");

  assert.equal(reuploadBlocker("UNDER_REVIEW", doc(), after), null);
  assert.equal(reuploadBlocker("UNDER_REVIEW", doc({ status: "VERIFIED" }), after), null, "a verified file can still be sent back");
  assert.equal(reuploadBlocker("UNDER_REVIEW", doc({ number_masked: null }), after), null, "a missing number does not stop a re-upload request");
  assert.equal(reuploadBlocker("UNDER_REVIEW", doc({ status: "REJECTED" }), after), "Waiting for a new file");
  assert.equal(reuploadBlocker("UNDER_REVIEW", doc(), null), "Open the file first");
  assert.equal(reuploadBlocker("NEW", doc(), after), "Start the review first");
}

console.log("partnerApplicationRules.check.js: ok");
