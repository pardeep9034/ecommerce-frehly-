// Live check of the applicant path (DELIVERY_PARTNER_ONBOARDING_DESIGN.md Phase 1).
// Service must be running, dev only. Run: docker compose exec -T delivery-service node partnerApplication.check.js
// Uses signed tokens for fake users 990001-990003 and removes every row and file it makes, before and after.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import { env } from "./src/config/env.js";
import initializeModels from "./src/models/index.js";

assert.notEqual(env.NODE_ENV, "production", "dev only");

const BASE = `http://localhost:${env.PORT}/delivery-partners/applications`;
const USERS = [990001, 990002, 990003];
const MAX = 5 * 1024 * 1024;
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const PDF = Buffer.from("%PDF-1.7 test");

const tokenFor = (userId, role = "DELIVERY_PARTNER") =>
  jwt.sign({ user_id: userId, phone: `99900${userId}`, role }, env.JWT_SECRET, { expiresIn: "5m" });

const call = async (method, urlPath, token, { json, file, fields } = {}) => {
  const headers = token ? { authorization: `Bearer ${token}` } : {};
  let body;
  if (json !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(json);
  }
  if (file) {
    body = new FormData();
    body.append("file", new Blob([file.bytes], { type: file.mime }), file.name ?? "upload");
    for (const [k, v] of Object.entries(fields ?? {})) body.append(k, v);
  }
  const res = await fetch(`${BASE}${urlPath}`, { method, headers, body });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const db = await initializeModels();
const sql = (query, replacements) => db.sequelize.query(query, { replacements });

const cleanup = async () => {
  const [rows] = await sql("SELECT id FROM delivery_partner_applications WHERE user_id IN (:ids)", { ids: USERS });
  for (const { id } of rows) fs.rmSync(path.resolve(env.STORAGE_DIR, "applications", id), { recursive: true, force: true });
  await sql("DELETE FROM delivery_partner_application_events WHERE application_id IN (SELECT id FROM delivery_partner_applications WHERE user_id IN (:ids))", { ids: USERS });
  await sql("DELETE FROM delivery_partner_applications WHERE user_id IN (:ids)", { ids: USERS });
};

const versionOf = async (id) => (await sql("SELECT version FROM delivery_partner_applications WHERE id = :id", { id }))[0][0].version;
const upload = (token, type, bytes, mime, fields) => call("PUT", `/me/documents/${type}`, token, { file: { bytes, mime }, fields });
const BIKE = { name: "Ravi Kumar", vehicle_type: "BIKE", vehicle_number: "pb 65 ax 4412" };

await cleanup();
try {
  const [A, B, C] = USERS.map((id) => tokenFor(id));

  // ---- who may call ----
  for (const [method, p] of [["POST", ""], ["GET", "/me"], ["PATCH", "/me"], ["PUT", "/me/documents/PHOTO"], ["DELETE", "/me/documents/PHOTO"], ["POST", "/me/submit"], ["POST", "/me/resubmit"]]) {
    assert.equal((await call(method, p, null)).status, 401, `${method} ${p}: no token`);
    for (const role of ["CUSTOMER", "ADMIN", "SUPER_ADMIN", "OPS_STAFF"]) {
      assert.equal((await call(method, p, tokenFor(1, role))).status, 403, `${method} ${p}: ${role} is not an applicant`);
    }
  }

  // ---- create ----
  assert.equal((await call("GET", "/me", A)).status, 404, "no application yet");
  const bad = await call("POST", "", A, { json: { name: "R" } });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.errors.length >= 2, "full error array: short name and missing vehicle_type");
  assert.equal((await call("POST", "", A, { json: { ...BIKE, status: "APPROVED" } })).status, 400, "status cannot be set");
  assert.equal((await call("POST", "", A, { json: { ...BIKE, phone: "9000000000" } })).status, 400, "phone cannot be sent");
  assert.equal((await call("POST", "", A, { json: { name: "Ravi Kumar", vehicle_type: "BIKE" } })).status, 400, "a bike needs a number");
  assert.equal((await call("POST", "", A, { json: { ...BIKE, preferred_zone_id: 987654 } })).status, 400, "unknown zone");

  const [racerA, racerB] = await Promise.all([call("POST", "", A, { json: BIKE }), call("POST", "", A, { json: BIKE })]);
  assert.deepEqual([racerA.status, racerB.status].sort(), [201, 409], "two simultaneous creates: one wins");
  const created = (racerA.status === 201 ? racerA : racerB).body.data;
  assert.equal(created.status, "DRAFT");
  assert.match(created.ref, /^FR-P-\d{4,}$/);
  assert.equal(created.phone, "99900990001", "phone comes from the token");
  assert.equal(created.vehicle_number, "PB 65 AX 4412");
  assert.deepEqual(created.required_docs, ["PHOTO", "AADHAAR", "DL", "RC"]);
  assert.equal((await call("POST", "", A, { json: BIKE })).status, 409, "one open application");
  assert.equal(await versionOf(created.id), 0, "a new application starts at version 0");

  // ---- edit details ----
  assert.equal((await call("PATCH", "/me", A, { json: {} })).status, 400, "empty patch");
  assert.equal((await call("PATCH", "/me", A, { json: { vehicle_type: "CYCLE" } })).body.data.vehicle_number, null, "cycle drops the plate");
  assert.equal((await call("PATCH", "/me", A, { json: { vehicle_type: "BIKE" } })).status, 400, "back to a bike needs a number");
  assert.equal((await call("PATCH", "/me", A, { json: { vehicle_type: "BIKE", vehicle_number: "PB65AX4412" } })).status, 200);
  assert.equal(await versionOf(created.id), 2, "two edits went through (+2); the refused one rolled back and did not count");

  // ---- upload rules ----
  assert.equal((await call("PUT", "/me/documents/PHOTO", A)).status, 400, "no file");
  assert.equal((await upload(A, "PHOTO", Buffer.from("MZ\x90\x00 not an image"), "image/jpeg")).status, 415, ".exe renamed .jpg");
  assert.equal((await upload(A, "PHOTO", Buffer.from("hello"), "text/plain")).status, 415, "declared type not allowed");
  assert.equal((await upload(A, "PHOTO", JPEG, "image/png")).status, 415, "bytes are a JPEG, declared PNG");
  assert.equal((await upload(A, "NOPE", JPEG, "image/jpeg")).status, 400, "unknown document type");
  assert.equal((await upload(A, "PHOTO", Buffer.concat([JPEG, Buffer.alloc(MAX - JPEG.length + 1)]), "image/jpeg")).status, 413, "5 MB + 1 byte");
  assert.equal((await upload(A, "PHOTO", JPEG, "image/jpeg", { number: "123" })).status, 400, "a photo has no number");
  assert.equal((await upload(A, "AADHAAR", JPEG, "image/jpeg", { number: "1234 5678 90" })).status, 400, "short Aadhaar number");
  assert.equal((await upload(A, "AADHAAR", JPEG, "image/jpeg", { expiry_date: "2030-01-01" })).status, 400, "only a licence expires");
  assert.equal((await upload(A, "DL", JPEG, "image/jpeg", { expiry_date: "not-a-date" })).status, 400, "bad date");

  const exactly5mb = await upload(A, "PHOTO", Buffer.concat([JPEG, Buffer.alloc(MAX - JPEG.length)]), "image/jpeg");
  assert.equal(exactly5mb.status, 200, "exactly 5 MB passes");
  assert.equal(exactly5mb.body.data.status, "UPLOADED");

  const aadhaar = await upload(A, "AADHAAR", PDF, "application/pdf", { number: "1234 5678 4412" });
  assert.equal(aadhaar.status, 200);
  assert.equal(aadhaar.body.data.number_masked, "•••• •••• 4412");
  assert.ok(!JSON.stringify(aadhaar.body).includes("12345678"), "full number never returned");
  for (const hidden of ["file_key", "sha256", "number_hmac"]) assert.ok(!(hidden in aadhaar.body.data), `${hidden} must not be returned`);

  // stored encrypted: not readable as an image, and the number is a keyed hash
  const [[photoRow]] = await sql("SELECT file_key FROM delivery_partner_documents WHERE type = 'PHOTO' AND application_id = :id", { id: created.id });
  const stored = fs.readFileSync(path.resolve(env.STORAGE_DIR, photoRow.file_key));
  assert.ok(!stored.subarray(0, 3).equals(JPEG.subarray(0, 3)), "stored file must not start like a JPEG");
  const [[aadhaarRow]] = await sql("SELECT number_hmac FROM delivery_partner_documents WHERE type = 'AADHAAR' AND application_id = :id", { id: created.id });
  assert.match(aadhaarRow.number_hmac, /^[0-9a-f]{64}$/);

  // replacing a file removes the old one and keeps the number typed earlier
  const beforeReplace = await versionOf(created.id);
  const replaced = await upload(A, "AADHAAR", PDF, "application/pdf");
  assert.equal(replaced.body.data.number_masked, "•••• •••• 4412", "number kept when only the file is replaced");
  assert.equal(await versionOf(created.id), beforeReplace + 1, "an upload bumps the version");
  const replacedPhoto = await upload(A, "PHOTO", JPEG, "image/jpeg");
  assert.equal(replacedPhoto.status, 200);
  assert.ok(!fs.existsSync(path.resolve(env.STORAGE_DIR, photoRow.file_key)), "old file removed after replace");
  const [[newPhotoRow]] = await sql("SELECT file_key FROM delivery_partner_documents WHERE type = 'PHOTO' AND application_id = :id", { id: created.id });
  assert.ok(fs.existsSync(path.resolve(env.STORAGE_DIR, newPhotoRow.file_key)), "new file on disk");

  // ---- submit ----
  assert.equal((await call("POST", "/me/submit", A, { json: { consent: true } })).status, 400, "licence and RC still missing");
  const missing = await call("POST", "/me/submit", A, { json: { consent: true } });
  assert.match(missing.body.message, /DL, RC/);
  assert.equal((await call("POST", "/me/submit", A, { json: {} })).status, 400, "consent required");
  assert.equal((await call("POST", "/me/submit", A, { json: { consent: false } })).status, 400, "consent must be true");

  assert.equal((await upload(A, "DL", JPEG, "image/jpeg", { number: "PB65 20150012345", expiry_date: "2031-06-30" })).body.data.expiry_date, "2031-06-30");
  const beforeDrop = await versionOf(created.id);
  assert.equal((await call("DELETE", "/me/documents/DL", A)).status, 200, "a draft can drop a document");
  assert.equal((await call("DELETE", "/me/documents/DL", A)).status, 404, "already gone");
  assert.equal(await versionOf(created.id), beforeDrop + 1, "dropping bumps once; the 404 does not");
  assert.equal((await upload(A, "DL", JPEG, "image/jpeg", { expiry_date: "2031-06-30" })).status, 200);
  assert.equal((await upload(A, "RC", JPEG, "image/jpeg")).status, 200);

  const beforeSubmit = await versionOf(created.id);
  const [first, second] = await Promise.all([
    call("POST", "/me/submit", A, { json: { consent: true } }),
    call("POST", "/me/submit", A, { json: { consent: true } }),
  ]);
  assert.deepEqual([first.status, second.status].sort(), [200, 409], "two simultaneous submits: one wins");
  assert.equal(await versionOf(created.id), beforeSubmit + 1, "one submit, one bump");
  const submitted = (await call("GET", "/me", A)).body.data;
  assert.equal(submitted.status, "NEW");
  assert.ok(submitted.submitted_at && submitted.consent_at);
  assert.equal(submitted.checks.length, 6, "all six checks for a bike");
  assert.deepEqual(submitted.checks.filter((c) => c.done).map((c) => c.key), ["PHONE_OTP"], "only the phone check starts done");
  assert.deepEqual(Object.keys(submitted.checks[0]).sort(), ["done", "key"], "no who/when/note for the applicant");
  assert.deepEqual(submitted.events.map((e) => e.type), ["SUBMITTED"], "timeline shows applicant-visible events only");
  const [[eventCount]] = await sql("SELECT count(*)::int AS n FROM delivery_partner_application_events WHERE application_id = :id", { id: created.id });
  assert.ok(eventCount.n >= 6, "internal events (CREATED, DOC_UPLOADED...) are logged but not shown");

  // locked after submit
  const lockedAt = await versionOf(created.id);
  assert.equal((await call("PATCH", "/me", A, { json: { name: "Someone Else" } })).status, 409);
  assert.equal((await upload(A, "PHOTO", JPEG, "image/jpeg")).status, 409);
  assert.equal((await call("DELETE", "/me/documents/PHOTO", A)).status, 409);
  assert.equal((await call("POST", "/me/submit", A, { json: { consent: true } })).status, 409);
  assert.equal((await call("POST", "/me/resubmit", A)).status, 409, "nothing to resubmit");
  assert.equal(await versionOf(created.id), lockedAt, "refused writes never bump the version");

  // ---- isolation: a second applicant sees none of it ----
  assert.equal((await call("GET", "/me", B)).status, 404);

  // ---- cycle: no licence, no RC, no plate, four checks ----
  const cycle = await call("POST", "", B, { json: { name: "Imran Khan", vehicle_type: "CYCLE", vehicle_number: "PB65AX4412" } });
  assert.equal(cycle.status, 201);
  assert.equal(cycle.body.data.vehicle_number, null, "a cycle never keeps a plate");
  assert.deepEqual(cycle.body.data.required_docs, ["PHOTO", "AADHAAR"]);
  assert.equal((await upload(B, "DL", JPEG, "image/jpeg")).status, 400, "a cycle does not need a licence");
  assert.equal((await upload(B, "PAN", JPEG, "image/jpeg", { number: "abcde-1234f" })).body.data.number_masked, "••••234F", "PAN is optional but allowed");
  await upload(B, "PHOTO", JPEG, "image/jpeg");
  await upload(B, "AADHAAR", JPEG, "image/jpeg", { number: "111122223333" });
  assert.equal((await call("POST", "/me/submit", B, { json: { consent: true } })).status, 200);
  assert.deepEqual((await call("GET", "/me", B)).body.data.checks.map((c) => c.key), ["PHONE_OTP", "ID_MATCH", "BG_CHECK", "SAFETY_BRIEFING"]);

  // ---- cooldown after a rejection ----
  await sql("UPDATE delivery_partner_applications SET status = 'REJECTED', decided_at = NOW() WHERE user_id = :u", { u: USERS[1] });
  const cooling = await call("POST", "", B, { json: BIKE });
  assert.equal(cooling.status, 403);
  assert.match(cooling.body.message, /apply again after \d{4}-\d{2}-\d{2}/);
  const rejectedView = (await call("GET", "/me", B)).body.data;
  assert.equal(rejectedView.status, "REJECTED");
  assert.ok(rejectedView.can_reapply_after, "status screen can show the reapply date");
  await sql("UPDATE delivery_partner_applications SET decided_at = NOW() - interval '31 days' WHERE user_id = :u", { u: USERS[1] });
  assert.equal((await call("POST", "", B, { json: BIKE })).status, 201, "after 30 days a new application is allowed");

  // ---- a reviewer's decision and an upload on the same application (the reviewer screens come in Phase 2, so play the
  // reviewer by hand: move the status on in a transaction and do not commit yet, which holds the row's write lock).
  // The upload read the application as editable before that; it must wait for the lock, see the new status and be
  // refused, leaving no row and no file behind. ----
  const [[draft]] = await sql("SELECT id FROM delivery_partner_applications WHERE user_id = :u AND status = 'DRAFT'", { u: USERS[1] });
  const reviewer = await db.sequelize.transaction();
  try {
    await db.sequelize.query("UPDATE delivery_partner_applications SET status = 'UNDER_REVIEW' WHERE id = :id", { replacements: { id: draft.id }, transaction: reviewer });

    let settled = false;
    const racing = upload(B, "PHOTO", JPEG, "image/jpeg").then((r) => { settled = true; return r; });
    await new Promise((resolve) => setTimeout(resolve, 600));
    assert.equal(settled, false, "the upload must wait for the reviewer's row lock");
    await reviewer.commit();

    assert.equal((await racing).status, 409, "after the reviewer's commit the application is no longer editable");
  } finally {
    if (!reviewer.finished) await reviewer.rollback();
  }
  const [[racedDocs]] = await sql("SELECT count(*)::int AS n FROM delivery_partner_documents WHERE application_id = :id", { id: draft.id });
  assert.equal(racedDocs.n, 0, "the refused upload left no document row");
  const racedDir = path.resolve(env.STORAGE_DIR, "applications", draft.id);
  assert.deepEqual(fs.existsSync(racedDir) ? fs.readdirSync(racedDir) : [], [], "and no orphan file");
  assert.equal(await versionOf(draft.id), 0, "and the refused upload did not bump the version");

  // ---- resubmit after the reviewer asked for changes (staff screens come in Phase 2, so set the state directly) ----
  await call("POST", "", C, { json: { name: "Sandeep Kaur", vehicle_type: "CYCLE" } });
  await upload(C, "PHOTO", JPEG, "image/jpeg");
  await upload(C, "AADHAAR", JPEG, "image/jpeg");
  await call("POST", "/me/submit", C, { json: { consent: true } });
  await sql("UPDATE delivery_partner_applications SET status = 'CHANGES_REQUESTED', reviewer_id = 7 WHERE user_id = :u", { u: USERS[2] });
  await sql("UPDATE delivery_partner_documents SET status = 'REJECTED', reject_reason = 'blurry' WHERE type = 'PHOTO' AND application_id IN (SELECT id FROM delivery_partner_applications WHERE user_id = :u)", { u: USERS[2] });
  assert.equal((await call("GET", "/me", C)).body.data.documents.find((d) => d.type === "PHOTO").reject_reason, "blurry", "applicant sees why");
  const refused = await call("POST", "/me/resubmit", C);
  assert.equal(refused.status, 400, "rejected document not replaced yet");
  assert.match(refused.body.message, /PHOTO/);
  assert.equal((await upload(C, "PHOTO", JPEG, "image/jpeg")).body.data.status, "UPLOADED", "a new file starts unreviewed");
  const [[beforeResubmit]] = await sql("SELECT version FROM delivery_partner_applications WHERE user_id = :u", { u: USERS[2] });
  assert.equal((await call("POST", "/me/resubmit", C)).status, 200);
  const [[resubmitted]] = await sql("SELECT status, reviewer_id, version FROM delivery_partner_applications WHERE user_id = :u", { u: USERS[2] });
  assert.equal(resubmitted.status, "UNDER_REVIEW");
  assert.equal(resubmitted.version, beforeResubmit.version + 1, "a resubmit bumps the version");
  assert.equal(String(resubmitted.reviewer_id), "7", "same reviewer");

  console.log("partnerApplication.check.js: ok");
} finally {
  await cleanup();
  await db.sequelize.close();
}
process.exit(0);
