// Live check of Phase 3 (on-behalf applications, summary, duplicate warnings, onboarding record).
// Service must be running, dev only. Run: docker compose exec -T delivery-service node partnerOnBehalf.check.js
// Uses signed tokens for fake applicants 992001-992020 and fake staff 992101-992104, and removes every row and file it
// makes, before and after. Sections are added step by step; each one is a block below.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import { env } from "./src/config/env.js";
import initializeModels from "./src/models/index.js";
import { WAITING_STATUSES, STATUSES } from "./src/modules/partnerApplication/partnerApplicationRules.js";

assert.notEqual(env.NODE_ENV, "production", "dev only");

const BASE = `http://localhost:${env.PORT}/delivery-partners/applications`;
const APPLICANTS = Array.from({ length: 20 }, (_, i) => 992001 + i);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const NO_ID = "00000000-0000-4000-8000-000000000000";

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
const sql = async (query, replacements) => (await db.sequelize.query(query, { replacements }))[0];

// Invitees staff add (step 5 on) get their account from the real auth-service, on these phones (99900920NN). The two
// services share one dev database, so the accounts are removed from here.
const INVITEE_LIKE = "99900920__";
const STAFF_IDS = [992101, 992102, 992103, 992104];
const ph = (n) => `99900920${String(n).padStart(2, "0")}`;

const cleanup = async () => {
  const authIds = (await sql("SELECT id FROM auth_users WHERE phone LIKE :like", { like: INVITEE_LIKE })).map((r) => r.id);
  const mine = "user_id IN (:ids) OR created_by IN (:staff)";
  const replacements = { ids: [...APPLICANTS, ...authIds], staff: STAFF_IDS };
  const apps = await sql(`SELECT id FROM delivery_partner_applications WHERE ${mine}`, replacements);
  for (const { id } of apps) fs.rmSync(path.resolve(env.STORAGE_DIR, "applications", id), { recursive: true, force: true });
  await sql(`DELETE FROM delivery_partner_application_events WHERE application_id IN (SELECT id FROM delivery_partner_applications WHERE ${mine})`, replacements);
  await sql(`DELETE FROM delivery_partner_applications WHERE ${mine}`, replacements);
  // Partners that approvals made, with what points at them, before the zone they stand in.
  const partners = "SELECT id FROM delivery_partners WHERE user_id IN (:ids)";
  await sql(`DELETE FROM delivery_partner_zones WHERE delivery_partner_id IN (${partners})`, { ids: replacements.ids });
  await sql(`DELETE FROM delivery_status_history WHERE delivery_partner_id IN (${partners})`, { ids: replacements.ids });
  await sql("DELETE FROM delivery_partners WHERE user_id IN (:ids)", { ids: replacements.ids });
  await sql("DELETE FROM delivery_zones WHERE code LIKE 'P3CHK-%'");

  if (authIds.length) {
    for (const table of ["auth_audit_logs", "auth_otps", "auth_refresh_tokens", "auth_user_sessions"]) {
      await sql(`DELETE FROM ${table} WHERE user_id IN (:ids)`, { ids: authIds });
    }
  }
  await sql("DELETE FROM auth_audit_logs WHERE phone LIKE :like", { like: INVITEE_LIKE });
  await sql("DELETE FROM auth_users WHERE phone LIKE :like", { like: INVITEE_LIKE });
};

const applicant = (n) => tokenFor(APPLICANTS[n - 1]);
const upload = (token, type, bytes, mime, fields) => call("PUT", `/me/documents/${type}`, token, { file: { bytes, mime }, fields });

// A submitted application made through the real applicant routes. `n` picks the fake applicant (1-20).
const seed = async (n, { name = "Anil P3Chk", cycle = false, submit = true, aadhaar = `1234 5678 ${2000 + n}`, dl = `PB65 2015002${2000 + n}` } = {}) => {
  const token = applicant(n);
  const json = cycle ? { name, vehicle_type: "CYCLE" } : { name, vehicle_type: "BIKE", vehicle_number: `PB65 P3 ${2000 + n}` };
  const created = await call("POST", "", token, { json });
  assert.equal(created.status, 201, `seed ${n}: create`);
  await upload(token, "PHOTO", JPEG, "image/jpeg");
  await upload(token, "AADHAAR", JPEG, "image/jpeg", { number: aadhaar });
  if (!cycle) {
    await upload(token, "DL", JPEG, "image/jpeg", { number: dl, expiry_date: "2031-06-30" });
    await upload(token, "RC", JPEG, "image/jpeg");
  }
  if (submit) assert.equal((await call("POST", "/me/submit", token, { json: { consent: true } })).status, 200, `seed ${n}: submit`);
  return created.body.data.id;
};

await cleanup();
try {
  const OPS = tokenFor(992101, "OPS_STAFF");
  const ADMIN = tokenFor(992102, "ADMIN");
  const SUPER = tokenFor(992104, "SUPER_ADMIN");
  const STAFF = { OPS_STAFF: OPS, ADMIN, SUPER_ADMIN: SUPER };

  // ---- who may call (E5): every new route is listed here as its step lands ----
  const STAFF_ROUTES = [
    ["GET", "/summary"],
    ["POST", "/on-behalf"],
    ["PUT", `/${NO_ID}/documents/PHOTO`],
    ["POST", `/${NO_ID}/submit`],
  ];
  for (const [method, p] of STAFF_ROUTES) {
    assert.equal((await call(method, p, null)).status, 401, `${method} ${p}: no token`);
    for (const role of ["CUSTOMER", "DELIVERY_PARTNER"]) {
      assert.equal((await call(method, p, tokenFor(1, role))).status, 403, `${method} ${p}: ${role} is not staff`);
    }
    for (const [role, token] of Object.entries(STAFF)) {
      const { status } = await call(method, p, token);
      assert.ok(status !== 401 && status !== 403, `${method} ${p}: ${role} gets in (got ${status})`);
    }
  }

  // ---- summary (step 3): equals a GROUP BY in SQL, whatever else is in the table ----
  const sqlSummary = async () => {
    const rows = await sql("SELECT status, COUNT(*)::int AS n, MIN(submitted_at) AS oldest FROM delivery_partner_applications GROUP BY status");
    const count = Object.fromEntries(STATUSES.map((s) => [s, rows.find((r) => r.status === s)?.n ?? 0]));
    const oldest = rows.filter((r) => WAITING_STATUSES.includes(r.status) && r.oldest).map((r) => new Date(r.oldest).getTime());
    return { count, waiting: WAITING_STATUSES.reduce((t, s) => t + count[s], 0), oldest: oldest.length ? Math.min(...oldest) : null };
  };
  const summary = async () => {
    const res = await call("GET", "/summary", OPS);
    assert.equal(res.status, 200, "GET /summary as staff");
    return res.body.data;
  };
  const sameAsSql = async (label) => {
    const [got, want] = [await summary(), await sqlSummary()];
    assert.deepEqual(Object.keys(got.by_status), STATUSES, `${label}: all six statuses, in order`);
    assert.deepEqual(got.by_status, want.count, `${label}: by_status equals SQL`);
    assert.equal(got.waiting, want.waiting, `${label}: waiting equals NEW + UNDER_REVIEW`);
    assert.equal(got.oldest_submitted_at === null ? null : new Date(got.oldest_submitted_at).getTime(), want.oldest, `${label}: oldest waiting`);
    assert.ok(Object.values(got.by_status).every((n) => typeof n === "number") && typeof got.waiting === "number", `${label}: numbers, not strings`);
    return got;
  };

  const before = await sameAsSql("baseline");
  await seed(1, { name: "Anil P3Chk", submit: false });
  let now = await sameAsSql("after a draft");
  assert.equal(now.by_status.DRAFT, before.by_status.DRAFT + 1);
  assert.equal(now.waiting, before.waiting, "E2: a draft is not waiting");

  const newId = await seed(2, { name: "Bimal P3Chk" });
  now = await sameAsSql("after a submit");
  assert.equal(now.waiting, before.waiting + 1, "a submitted application is waiting");
  assert.equal(now.by_status.NEW, before.by_status.NEW + 1);

  const reviewId = await seed(3, { name: "Chand P3Chk" });
  assert.equal((await call("POST", `/${reviewId}/start-review`, OPS)).status, 200);
  now = await sameAsSql("after a review starts");
  assert.equal(now.waiting, before.waiting + 2, "UNDER_REVIEW still counts as waiting");
  assert.equal(now.by_status.UNDER_REVIEW, before.by_status.UNDER_REVIEW + 1);

  // CHANGES_REQUESTED is the applicant's turn (E2); it leaves the waiting count
  await sql("UPDATE delivery_partner_applications SET status = 'CHANGES_REQUESTED' WHERE id = :id", { id: reviewId });
  now = await sameAsSql("after changes are requested");
  assert.equal(now.waiting, before.waiting + 1, "CHANGES_REQUESTED is not waiting");
  await sql("UPDATE delivery_partner_applications SET status = 'REJECTED', decided_at = NOW() WHERE id = :id", { id: reviewId });
  await sameAsSql("after a rejection");

  // E3: the oldest waiting date follows the application, not the clock; backdating one moves it
  await sql("UPDATE delivery_partner_applications SET submitted_at = NOW() - INTERVAL '400 days' WHERE id = :id", { id: newId });
  now = await sameAsSql("after backdating");
  assert.ok(Date.now() - new Date(now.oldest_submitted_at).getTime() > 399 * 86_400_000, "the oldest waiting date is the backdated one");

  // ---- duplicate warnings (step 4, F1-F8): a reviewer is told, nothing is blocked ----
  const dupes = async (id, token = OPS) => {
    const res = await call("GET", `/${id}`, token);
    assert.equal(res.status, 200, `detail ${id}`);
    return { res, list: res.body.data.warnings.filter((w) => w.code === "DUPLICATE_DOCUMENT") };
  };
  const SHARED = "1111 2222 3333";
  const a6 = await seed(6, { name: "Farid P3Chk", aadhaar: SHARED });
  const a7 = await seed(7, { name: "Gita P3Chk", aadhaar: SHARED });
  const a8 = await seed(8, { name: "Harpal P3Chk", aadhaar: "1111-2222-3333" }); // F5: same number, other spacing
  const a9 = await seed(9, { name: "Indu P3Chk", dl: "111122223333" });          // F3: a licence equal to that Aadhaar number

  // F1: warned on both sides, with the other person's reference, status and name
  let { res, list } = await dupes(a6);
  assert.deepEqual(list.map((w) => w.type), ["AADHAAR", "AADHAAR"], "F1/F5: two others carry this Aadhaar (Gita, Harpal)");
  const others = list.map((w) => w.other.application_id).sort();
  assert.deepEqual(others, [a7, a8].sort(), "the other applications are named");
  const gita = list.find((w) => w.other.application_id === a7).other;
  assert.deepEqual(Object.keys(gita).sort(), ["application_id", "name", "ref_no", "status"], "only what the reviewer needs about the other person");
  assert.equal(gita.name, "Gita P3Chk");
  assert.equal(gita.status, "NEW");
  assert.ok(!JSON.stringify(res.body).includes("111122223333"), "the full number never appears");
  assert.equal((await dupes(a7)).list.length, 2, "F1: the warning is on both applications");
  assert.equal((await dupes(a8)).list.length, 2, "F5: so is the one typed with hyphens");

  // F3: a licence number equal to an Aadhaar number is a different document type, so no warning
  assert.equal((await dupes(a9)).list.length, 0, "F3: type is part of the match");

  // F7: every staff role sees it, not only approvers
  for (const [role, token] of Object.entries(STAFF)) assert.equal((await dupes(a6, token)).list.length, 2, `F7: ${role} sees duplicates`);

  // F8: the applicant's own view carries no warnings and nothing about anyone else
  const mine = await call("GET", "/me", applicant(6));
  assert.equal(mine.status, 200);
  assert.equal(mine.body.data.warnings, undefined, "F8: no warnings on /me");
  assert.ok(!JSON.stringify(mine.body).includes("Gita") && !JSON.stringify(mine.body).includes("Harpal"), "F8: no other applicant's details");

  // F2: the same person re-applying after a rejection is not a duplicate of themselves
  const first = await seed(10, { name: "Jeet P3Chk", aadhaar: "5555 6666 7777" });
  await sql("UPDATE delivery_partner_applications SET status = 'REJECTED', decided_at = NOW() - INTERVAL '40 days' WHERE id = :id", { id: first });
  const second = await seed(10, { name: "Jeet P3Chk", aadhaar: "5555 6666 7777" });
  assert.notEqual(first, second);
  assert.equal((await dupes(first)).list.length, 0, "F2: an earlier application of the same person");
  assert.equal((await dupes(second)).list.length, 0, "F2: nor the new one");

  // F4: a PAN with no number typed has no hash, so there is nothing to match
  // (drafts: a submitted application takes no more uploads, and duplicates are found whatever the status)
  const [p1, p2] = [await seed(11, { cycle: true, submit: false }), await seed(12, { cycle: true, submit: false })];
  for (const n of [11, 12]) assert.equal((await upload(applicant(n), "PAN", JPEG, "image/jpeg")).status, 200, "PAN without a number is accepted");
  assert.equal((await dupes(p1)).list.length, 0, "F4");
  assert.equal((await dupes(p2)).list.length, 0, "F4");

  // a typed PAN does match, and it warns on the PAN, not on the Aadhaar
  for (const n of [11, 12]) assert.equal((await upload(applicant(n), "PAN", JPEG, "image/jpeg", { number: "ABCDE1234F" })).status, 200);
  assert.deepEqual((await dupes(p1)).list.map((w) => [w.type, w.other.application_id]), [["PAN", p2]]);

  // a warning never blocks: the review actions on a duplicated application still work
  assert.equal((await call("POST", `/${a6}/start-review`, OPS)).status, 200, "warnings do not block");

  // ---- on-behalf creation (step 5, G1-G9): staff add someone; the real auth-service makes the account ----
  const authUser = async (phone) => (await sql("SELECT id, role, phone_verified, profile_complete FROM auth_users WHERE phone = :phone", { phone }))[0];
  const rowsFor = async (phone) => sql("SELECT id, user_id, created_by, source, status, vehicle_number FROM delivery_partner_applications WHERE phone = :phone", { phone });
  const dropApplications = async (phone) => {
    await sql("DELETE FROM delivery_partner_application_events WHERE application_id IN (SELECT id FROM delivery_partner_applications WHERE phone = :phone)", { phone });
    await sql("DELETE FROM delivery_partner_applications WHERE phone = :phone", { phone });
  };
  const addPartner = (token, over = {}) =>
    call("POST", "/on-behalf", token, { json: { phone: ph(1), name: "Kiran P3Chk", vehicle_type: "BIKE", vehicle_number: "PB65 P3 7001", ...over } });

  // G2: a refused form never reaches the account service, so no account is made for it
  const BAD = [
    ["a short phone", { phone: "98765" }],
    ["a phone starting with 5", { phone: "5999009201" }],
    ["a phone with letters", { phone: "99900920ab" }],
    ["a country code", { phone: "+919990092001" }],
    ["a one-letter name", { name: "K" }],
    ["a 51-letter name", { name: "K".repeat(51) }],
    ["no name", { name: undefined }],
    ["no vehicle type", { vehicle_type: undefined }],
    ["an unknown vehicle type", { vehicle_type: "TRUCK" }],
    ["a bike with no plate", { vehicle_number: undefined }],
    ["a bad email", { email: "nope" }],
    ["an unknown zone", { preferred_zone_id: 987654 }],
    ["a status in the body", { status: "NEW" }],
    ["a user id in the body", { user_id: 1 }],
    ["a source in the body", { source: "SELF" }],
  ];
  for (const [label, over] of BAD) assert.equal((await addPartner(ADMIN, over)).status, 400, `G2: ${label}`);
  assert.match((await addPartner(ADMIN, { phone: "98765" })).body.message, /10-digit/, "G2: the phone message says what to type");
  assert.equal(await authUser(ph(1)), undefined, "G2: a refused form made no account");
  assert.equal((await sql("SELECT 1 FROM delivery_partner_applications WHERE created_by IN (:staff)", { staff: STAFF_IDS })).length, 0, "G2: nor an application");

  // G3: the draft, the unverified account, and the CREATED event that says it was on someone's behalf
  const made = await addPartner(ADMIN);
  assert.equal(made.status, 201, "G3: created");
  const draft = made.body.data;
  assert.equal(draft.status, "DRAFT");
  assert.equal(draft.source, "ADMIN");
  assert.equal(draft.created_by, 992102);
  assert.equal(draft.phone, ph(1));
  assert.equal(draft.name, "Kiran P3Chk");
  assert.equal(draft.vehicle_number, "PB65 P3 7001");
  assert.equal(draft.invite_sent, true, "G3: a new number is invited");
  assert.equal(draft.events.length, 1);
  assert.deepEqual(
    [draft.events[0].type, draft.events[0].actor_id, draft.events[0].actor_role, draft.events[0].payload, draft.events[0].visible_to_applicant],
    ["CREATED", 992102, "ADMIN", { on_behalf: true }, false], "G3: the event names the staff member and the on-behalf flag"
  );
  const account = await authUser(ph(1));
  assert.ok(account, "G3: the account exists");
  assert.equal(account.role, "DELIVERY_PARTNER");
  assert.equal(account.phone_verified, false, "G3: the invitee has not proven the phone yet");
  const [row] = await rowsFor(ph(1));
  assert.equal(String(row.user_id), String(account.id), "G3: the application belongs to that account");
  assert.deepEqual([row.source, Number(row.created_by)], ["ADMIN", 992102]);

  // G4: a second try for the same number is refused, whoever makes it, and adds nothing
  for (const token of [ADMIN, OPS]) {
    const again = await addPartner(token, { name: "Someone Else" });
    assert.equal(again.status, 409, "G4");
    assert.match(again.body.message, /open application/);
  }
  assert.equal((await rowsFor(ph(1))).length, 1, "G4: still one application");

  // G5: a draft is not in the default queue or the waiting count (P3-10) but shows under the Draft filter
  const listed = async (query) => (await call("GET", `/?search=${ph(1)}&limit=100${query}`, OPS)).body.data.applications.map((a) => a.id);
  assert.ok(!(await listed("")).includes(draft.id), "G5: not in the default queue");
  assert.ok((await listed("&status=DRAFT")).includes(draft.id), "G5: under the Draft filter");
  await sameAsSql("with an on-behalf draft");

  // G6: a cycle has no plate, whatever was sent
  const cycle = await addPartner(ADMIN, { phone: ph(2), name: "Lata P3Chk", vehicle_type: "CYCLE", vehicle_number: "PB65 X 9999" });
  assert.equal(cycle.status, 201);
  assert.equal(cycle.body.data.vehicle_number, null);

  // G7: an account that already finishes sign-up needs no invite text (P3-7); the application is still made
  assert.equal((await addPartner(ADMIN, { phone: ph(3), name: "Mohan P3Chk" })).status, 201);
  await dropApplications(ph(3));
  await sql("UPDATE auth_users SET phone_verified = true, profile_complete = true WHERE phone = :phone", { phone: ph(3) });
  const registered = await addPartner(ADMIN, { phone: ph(3), name: "Mohan P3Chk" });
  assert.equal(registered.status, 201, "G7");
  assert.equal(registered.body.data.invite_sent, false, "G7: a registered number is not texted");

  // G8: the account call is by phone, so a retry after a refusal reuses the account instead of making a second
  assert.equal((await addPartner(ADMIN, { phone: ph(4), name: "Nitin P3Chk" })).status, 201);
  const firstAccount = await authUser(ph(4));
  await dropApplications(ph(4));
  assert.equal((await addPartner(ADMIN, { phone: ph(4), name: "Nitin P3Chk" })).status, 201, "G8: retry");
  assert.equal((await authUser(ph(4))).id, firstAccount.id, "G8: same account");
  assert.equal((await sql("SELECT 1 FROM auth_users WHERE phone = :phone", { phone: ph(4) })).length, 1);

  // G9: a number that belongs to a customer is refused with the account service's reason, and no application is made
  assert.equal((await addPartner(ADMIN, { phone: ph(5), name: "Om P3Chk" })).status, 201);
  await dropApplications(ph(5));
  await sql("UPDATE auth_users SET role = 'CUSTOMER' WHERE phone = :phone", { phone: ph(5) });
  const notPartner = await addPartner(ADMIN, { phone: ph(5), name: "Om P3Chk" });
  assert.equal(notPartner.status, 409, "G9");
  assert.equal((await rowsFor(ph(5))).length, 0, "G9: no application");

  // G10: someone rejected recently must wait out the cooldown, the same as applying themselves
  const cooled = await addPartner(ADMIN, { phone: ph(6), name: "Pooja P3Chk" });
  assert.equal(cooled.status, 201);
  await sql("UPDATE delivery_partner_applications SET status = 'REJECTED', decided_at = NOW() WHERE id = :id", { id: cooled.body.data.id });
  const early = await addPartner(ADMIN, { phone: ph(6), name: "Pooja P3Chk" });
  assert.equal(early.status, 403, "G10");
  assert.match(early.body.message, /can apply again after \d{4}-\d{2}-\d{2}/);
  await sql("UPDATE delivery_partner_applications SET decided_at = NOW() - INTERVAL '40 days' WHERE id = :id", { id: cooled.body.data.id });
  assert.equal((await addPartner(ADMIN, { phone: ph(6), name: "Pooja P3Chk" })).status, 201, "G10: after the cooldown");

  // ---- staff fill in and submit a draft they created (step 6, H1-H10) ----
  const put = (token, id, type, fields) => call("PUT", `/${id}/documents/${type}`, token, { file: { bytes: JPEG, mime: "image/jpeg" }, fields });
  const submitFor = (token, id, json = { consent_attested: true }) => call("POST", `/${id}/submit`, token, { json });
  const detailOf = async (id, token = OPS) => (await call("GET", `/${id}`, token)).body.data;

  // H1: what the screen needs to draw the draft
  let view = await detailOf(draft.id);
  assert.deepEqual(view.required_docs, ["PHOTO", "AADHAAR", "DL", "RC"], "H1");
  assert.deepEqual(view.optional_docs, ["PAN"]);
  assert.equal(view.can_upload, true);
  assert.equal(view.can_submit, false, "H1: nothing uploaded yet");
  assert.match(view.submit_blocked_by, /PHOTO, AADHAAR, DL, RC/);

  // H2: submitting early, or without the attestation, is refused and changes nothing
  assert.equal((await submitFor(ADMIN, draft.id)).status, 400, "H2: documents missing");
  for (const json of [{}, { consent_attested: false }, { consent: true }, { consent_attested: "yes" }]) {
    assert.equal((await submitFor(ADMIN, draft.id, json)).status, 400, `H2: ${JSON.stringify(json)}`);
  }
  assert.equal((await detailOf(draft.id)).status, "DRAFT");

  // H3: refused uploads
  assert.equal((await put(OPS, draft.id, "XYZ")).status, 404, "H3: unknown type");
  assert.equal((await put(OPS, draft.id, "PHOTO", { number: "1234" })).status, 400, "H3: a photo has no number");
  assert.equal((await put(OPS, draft.id, "AADHAAR", { number: "12" })).status, 400, "H3: not an Aadhaar number");
  assert.equal((await put(OPS, draft.id, "AADHAAR", { expiry_date: "2031-06-30" })).status, 400, "H3: only a licence has an expiry");
  assert.equal((await put(OPS, NO_ID, "PHOTO")).status, 404, "H3: unknown id");
  assert.equal((await put(OPS, "not-a-uuid", "PHOTO")).status, 404, "H3: malformed id");
  assert.equal((await detailOf(draft.id)).documents.length, 0, "H3: nothing was stored");
  assert.equal((await put(OPS, cycle.body.data.id, "DL", { number: "PB65 20150027001", expiry_date: "2031-06-30" })).status, 400, "H3: a cycle needs no licence");

  // H4: a self-applicant's application is theirs alone (P3-4), whatever its status
  const selfDraft = await seed(13, { name: "Qadir P3Chk", submit: false });
  for (const [what, res] of [["upload", await put(ADMIN, selfDraft, "PAN")], ["submit", await submitFor(ADMIN, selfDraft)]]) {
    assert.equal(res.status, 409, `H4: staff ${what} on a self-applicant's draft`);
    assert.match(res.body.message, /Only the applicant/);
  }
  assert.equal((await detailOf(selfDraft)).can_upload, false, "H4: the screen is told not to offer it");
  assert.equal((await put(ADMIN, newId, "PAN")).status, 409, "H4: nor on a submitted one");

  // H5: staff upload; each file is on the draft, flagged as on someone's behalf, and the number is masked
  assert.equal((await put(OPS, draft.id, "PHOTO")).status, 200, "H5");
  assert.equal((await put(OPS, draft.id, "AADHAAR", { number: "1234 5678 7001" })).status, 200);
  assert.equal((await put(OPS, draft.id, "DL", { number: "PB65 20150027001", expiry_date: "2031-06-30" })).status, 200);
  view = await detailOf(draft.id);
  assert.equal(view.can_submit, false, "H5: the registration certificate is still missing");
  assert.match(view.submit_blocked_by, /^Upload these documents first: RC$/);
  const last = await put(OPS, draft.id, "RC");
  assert.equal(last.status, 200);
  assert.equal(last.body.data.id, draft.id, "H5: the response is the staff detail");
  view = last.body.data;
  assert.deepEqual(view.documents.map((d) => [d.type, d.status]), [["PHOTO", "UPLOADED"], ["AADHAAR", "UPLOADED"], ["DL", "UPLOADED"], ["RC", "UPLOADED"]]);
  assert.equal(view.can_submit, true);
  assert.equal(view.submit_blocked_by, null);
  assert.ok(view.documents.find((d) => d.type === "AADHAAR").number_masked.endsWith("7001"));
  assert.ok(!JSON.stringify(last.body).includes("123456787001"), "H5: the full number never comes back");
  const uploads = view.events.filter((e) => e.type === "DOC_UPLOADED");
  assert.equal(uploads.length, 4);
  assert.ok(uploads.every((e) => e.actor_id === 992101 && e.payload.on_behalf === true), "H5: who, and on whose behalf");

  // H6: replacing a file keeps the number typed earlier and does not add a second row
  assert.equal((await put(OPS, draft.id, "AADHAAR")).status, 200);
  view = await detailOf(draft.id);
  assert.equal(view.documents.length, 4, "H6");
  assert.ok(view.documents.find((d) => d.type === "AADHAAR").number_masked.endsWith("7001"), "H6: number kept");

  // H7: submit by the creator. The attestation is kept; PHONE_OTP waits for the invitee (P3-6)
  const before7 = await sameAsSql("before the staff submit");
  const submitted = await submitFor(ADMIN, draft.id);
  assert.equal(submitted.status, 200, "H7");
  view = submitted.body.data;
  assert.equal(view.status, "NEW");
  assert.ok(view.submitted_at);
  assert.equal(view.can_upload, false, "H7: no longer a draft");
  assert.equal(view.can_submit, false);
  const sent = view.events.find((e) => e.type === "SUBMITTED");
  assert.deepEqual([sent.actor_id, sent.actor_role, sent.payload, sent.visible_to_applicant], [992102, "ADMIN", { on_behalf: true, consent_attested: true }, true], "H7");
  assert.deepEqual(view.checks.map((c) => [c.key, c.done]), view.checks.map((c) => [c.key, false]), "H7: every check starts undone, PHONE_OTP included");
  assert.ok(view.checks.some((c) => c.key === "PHONE_OTP"));
  const after7 = await sameAsSql("after the staff submit");
  assert.equal(after7.waiting, before7.waiting + 1, "H7: it is waiting for review now");
  assert.equal(after7.by_status.DRAFT, before7.by_status.DRAFT - 1);

  // H8: it cannot be submitted or filled in again
  assert.equal((await submitFor(ADMIN, draft.id)).status, 409, "H8: submit twice");
  assert.equal((await submitFor(OPS, draft.id)).status, 409, "H8: or by someone else");
  assert.equal((await put(OPS, draft.id, "PAN")).status, 409, "H8: upload after submit");
  assert.equal((await rowsFor(ph(1)))[0].status, "NEW");

  // ---- the exit test (step 7, I1-I9): staff review it, the invitee signs up, a second admin approves ----
  // The invitee's token is signed here with the real account's id and the application's phone: delivery-service only verifies
  // the signature, so it is what auth-service issues once the invitee has passed the sign-up OTP.
  const accountId = Number(account.id); // the raw query returns the BIGINT as a string; a token carries a number
  const invitee = jwt.sign({ user_id: accountId, phone: ph(1), role: "DELIVERY_PARTNER" }, env.JWT_SECRET, { expiresIn: "5m" });
  const stranger = jwt.sign({ user_id: accountId, phone: "9990099999", role: "DELIVERY_PARTNER" }, env.JWT_SECRET, { expiresIn: "5m" });
  const zone = await db.DeliveryZone.create({ code: "P3CHK-1", name: "P3Chk Zone", city: "Mohali", is_active: true });
  const versionOf = async (id) => (await sql("SELECT version FROM delivery_partner_applications WHERE id = :id", { id }))[0].version;
  const phoneEvents = () => sql("SELECT actor_id, actor_role, payload, visible_to_applicant FROM delivery_partner_application_events WHERE application_id = :id AND type = 'CHECK_DONE' AND payload->>'key' = 'PHONE_OTP'", { id: draft.id });
  const approveWith = async (token, over = {}) =>
    call("POST", `/${draft.id}/approve`, token, { json: { zone_id: Number(zone.id), max_active_orders: 4, expected_version: await versionOf(draft.id), ...over } });

  // I1: an ordinary review by someone who is not the creator. The Docker VM clock steps back, so a file is opened a moment after upload.
  assert.equal((await call("POST", `/${draft.id}/start-review`, OPS)).status, 200, "I1");
  for (const type of ["PHOTO", "AADHAAR", "DL", "RC"]) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    assert.equal((await call("GET", `/${draft.id}/documents/${type}/url`, OPS)).status, 200, `I1: open ${type}`);
    assert.equal((await call("POST", `/${draft.id}/documents/${type}/verify`, OPS)).status, 200, `I1: verify ${type}`);
  }
  for (const key of ["ID_MATCH", "DL_VALID", "RC_MATCH", "BG_CHECK", "SAFETY_BRIEFING"]) {
    assert.equal((await call("PUT", `/${draft.id}/checks/${key}`, OPS, { json: { done: true, note: "BGV-1" } })).status, 200, `I1: ${key}`);
  }
  view = await detailOf(draft.id);
  assert.deepEqual(view.gaps.map((g) => [g.code, g.check]), [["CHECK_NOT_DONE", "PHONE_OTP"]], "I1: only the invitee's phone is left");
  assert.equal(view.checks.find((c) => c.key === "PHONE_OTP").can_tick, false, "I1: staff cannot tick it by hand");
  assert.equal(view.can_decide.approve, false);

  // I2: the creator cannot approve (D5); another admin cannot yet, and is told why
  const stale = await versionOf(draft.id);
  assert.equal((await approveWith(ADMIN)).status, 403, "I2: creator");
  const notYet = await approveWith(SUPER);
  assert.equal(notYet.status, 400, "I2: not yet");
  assert.deepEqual(notYet.body.errors.map((g) => g.check), ["PHONE_OTP"]);

  // I3: a token with another phone proves nothing (the application is looked up by user id, the proof is the phone)
  assert.equal((await call("GET", "/me", stranger)).status, 200);
  assert.equal(await versionOf(draft.id), stale, "I3: nothing changed");
  assert.equal((await phoneEvents()).length, 0);

  // I4: the invitee's first look ticks it, once, and the applicant sees nothing about it
  const mineNow = await call("GET", "/me", invitee);
  assert.equal(mineNow.status, 200, "I4");
  assert.equal(mineNow.body.data.id, draft.id);
  assert.equal(mineNow.body.data.status, "UNDER_REVIEW");
  assert.equal(mineNow.body.data.source, "ADMIN");
  assert.equal(mineNow.body.data.checks.find((c) => c.key === "PHONE_OTP").done, true, "I4: ticked in their own view");
  assert.equal(await versionOf(draft.id), stale + 1, "I4: a reviewer's screen is now stale");
  const flips = await phoneEvents();
  assert.equal(flips.length, 1);
  assert.deepEqual([Number(flips[0].actor_id), flips[0].actor_role, flips[0].payload, flips[0].visible_to_applicant], [accountId, "DELIVERY_PARTNER", { key: "PHONE_OTP", on_behalf: true }, false]);
  assert.ok(!mineNow.body.data.events.some((e) => e.type === "CHECK_DONE"), "I4: not on the applicant's timeline");
  await call("GET", "/me", invitee);
  assert.equal(await versionOf(draft.id), stale + 1, "I4: a second look changes nothing");
  assert.equal((await phoneEvents()).length, 1);
  view = await detailOf(draft.id);
  const otp = view.checks.find((c) => c.key === "PHONE_OTP");
  assert.deepEqual([otp.done, otp.done_by], [true, accountId]);
  assert.deepEqual(view.gaps, [], "I4: nothing left");

  // I5: a reviewer holding the earlier screen is refused with the version to reload; a fresh screen approves
  const refused = await approveWith(SUPER, { expected_version: stale });
  assert.equal(refused.status, 409, "I5: stale screen");
  assert.deepEqual(refused.body.errors, { version: stale + 1 });
  assert.equal((await approveWith(ADMIN)).status, 403, "I5: still not the creator");
  assert.equal((await approveWith(OPS)).status, 403, "I5: OPS cannot decide (D4)");
  const approved = await approveWith(SUPER);
  assert.equal(approved.status, 201, `I5: ${approved.body?.message}`);
  const partnerId = approved.body.data.partner_id;
  assert.ok(partnerId, "I5: a partner id comes back");

  // I6: an ACTIVE partner, in the dashboard list, linked to its application
  const [partner] = await sql("SELECT user_id, name, phone, status, vehicle_number, zone_id, application_id, max_active_orders FROM delivery_partners WHERE id = :id", { id: partnerId });
  assert.deepEqual(
    [String(partner.user_id), partner.name, partner.phone, partner.status, partner.vehicle_number, String(partner.zone_id), partner.application_id, partner.max_active_orders],
    [String(account.id), "Kiran P3Chk", ph(1), "ACTIVE", "PB65 P3 7001", String(zone.id), draft.id, 4], "I6"
  );
  const dashboard = await fetch(`http://localhost:${env.PORT}/delivery-partners/list?search=Kiran%20P3Chk`, { headers: { authorization: `Bearer ${OPS}` } });
  assert.equal(dashboard.status, 200);
  assert.ok((await dashboard.json()).data.partners.some((p) => p.id === partnerId), "I6: listed for the dashboard");

  // I7: the decision is on the record, and the number is spoken for
  view = await detailOf(draft.id);
  assert.equal(view.status, "APPROVED");
  assert.equal(view.decision.partner_id, partnerId);
  assert.equal(view.decision.decided_by, 992104);
  assert.equal((await addPartner(ADMIN)).status, 409, "I7: already a partner");
  assert.match((await addPartner(ADMIN)).body.message, /already belongs to a delivery partner/);

  // ---- the partner page's record (step 8, J1-J6): GET /delivery-partners/:id/onboarding ----
  const onboarding = async (id, token = OPS) => {
    const res = await fetch(`http://localhost:${env.PORT}/delivery-partners/${id}/onboarding`, { headers: token ? { authorization: `Bearer ${token}` } : {} });
    return { status: res.status, body: await res.json().catch(() => null) };
  };

  // J1: staff only; a partner cannot read another partner's record, or their own
  assert.equal((await onboarding(partnerId, null)).status, 401, "J1");
  for (const role of ["CUSTOMER", "DELIVERY_PARTNER"]) assert.equal((await onboarding(partnerId, tokenFor(1, role))).status, 403, `J1: ${role}`);
  assert.equal((await onboarding(NO_ID, tokenFor(1, "CUSTOMER"))).status, 403, "J1: the role is judged before the id");
  for (const [role, token] of Object.entries(STAFF)) assert.equal((await onboarding(partnerId, token)).status, 200, `J1: ${role}`);

  // J2: a partner that came through an on-behalf application: who, what was sent, what was decided
  const story = await onboarding(partnerId);
  const record = story.body.data;
  assert.deepEqual(Object.keys(record).sort(), ["application", "documents", "events", "partner"]);
  assert.deepEqual(
    [record.partner.id, record.partner.name, record.partner.vehicle_number, record.partner.status, record.partner.zone],
    [partnerId, "Kiran P3Chk", "PB65 P3 7001", "ACTIVE", { id: Number(zone.id), name: "P3Chk Zone" }], "J2: partner"
  );
  assert.ok(!JSON.stringify(story.body).includes(ph(1)), "J2: the phone is masked");
  assert.match(record.partner.phone, /^•+\d{3}$/);
  assert.deepEqual(
    [record.application.id, record.application.source, record.application.status, record.application.created_by],
    [draft.id, "ADMIN", "APPROVED", 992102], "J2: application"
  );
  assert.match(record.application.ref, /^FR-P-\d+$/);
  assert.ok(record.application.submitted_at && record.application.decided_at);
  assert.deepEqual(record.documents.map((d) => [d.type, d.status]).sort(), [["AADHAAR", "VERIFIED"], ["DL", "VERIFIED"], ["PHOTO", "VERIFIED"], ["RC", "VERIFIED"]], "J2: documents");
  assert.ok(record.documents.find((d) => d.type === "AADHAAR").number_masked.endsWith("7001"));
  assert.equal(record.documents.find((d) => d.type === "DL").expiry_date, "2031-06-30");
  for (const hidden of ["file_key", "sha256", "number_hmac", "123456787001", "PB652015002"]) {
    assert.ok(!JSON.stringify(story.body).includes(hidden), `J2: ${hidden} is not returned`);
  }
  const kinds = record.events.map((e) => e.type);
  assert.equal(kinds[0], "CREATED", "J2: starts with the creation");
  assert.deepEqual(record.events[0].payload, { on_behalf: true });
  assert.equal(kinds.at(-1), "APPROVED", "J2: ends with the decision");
  assert.equal(record.events.at(-1).actor_id, 992104);
  assert.ok(!kinds.includes("DOC_VIEWED"), "J2: opening a file is not part of the story");
  for (const wanted of ["DOC_UPLOADED", "SUBMITTED", "REVIEW_STARTED", "CHECK_DONE"]) assert.ok(kinds.includes(wanted), `J2: ${wanted}`);
  assert.deepEqual(record.events.find((e) => e.type === "SUBMITTED").payload, { on_behalf: true, consent_attested: true });
  assert.ok(record.events.every((e, i) => i === 0 || new Date(e.created_at) >= new Date(record.events[i - 1].created_at)), "J2: in order");

  // J3: a partner an admin created directly has no application; the page shows an empty record, not someone else's
  const direct = await db.DeliveryPartner.create({
    user_id: APPLICANTS[0], name: "Direct P3Chk", phone: "9990099001", vehicle_type: "BIKE", vehicle_number: "PB65 P3 9001",
    max_active_orders: 3, status: "ACTIVE", joined_at: new Date(),
  });
  const bare = await onboarding(direct.id);
  assert.equal(bare.status, 200, "J3");
  assert.equal(bare.body.data.partner.name, "Direct P3Chk");
  assert.equal(bare.body.data.partner.zone, null);
  assert.deepEqual([bare.body.data.application, bare.body.data.documents, bare.body.data.events], [null, [], []]);

  // J4: ids that name nothing, or are not ids at all, are a 404, not a database error
  for (const id of ["99999999", "0", "abc", NO_ID]) assert.equal((await onboarding(id)).status, 404, `J4: ${id}`);

  // J5: the older routes around it still answer as before (route order)
  const open = await fetch(`http://localhost:${env.PORT}/delivery-partners/${partnerId}`);
  assert.equal(open.status, 200, "J5: the public read");
  assert.equal("name" in (await open.json()).data, false, "J5: still without personal data");

  console.log("partnerOnBehalf.check.js: ok");
} finally {
  await cleanup().catch((error) => console.error("cleanup failed:", error.message));
  await db.sequelize.close();
}
