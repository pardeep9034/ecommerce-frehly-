// Live check of the review path (DELIVERY_PARTNER_ONBOARDING_DESIGN.md Phase 2).
// Service must be running, dev only. Run: docker compose exec -T delivery-service node partnerReview.check.js
// Uses signed tokens for fake applicants 991001-991020 and fake staff 991101-991104, a fake zone with code RVCHK-*,
// and removes every row and file it makes, before and after.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import { env } from "./src/config/env.js";
import initializeModels from "./src/models/index.js";
import { normalizePlate, reapplyDate, todayIST } from "./src/modules/partnerApplication/partnerApplicationRules.js";
import { sms } from "./src/utils/notify.js";

assert.notEqual(env.NODE_ENV, "production", "dev only");

const BASE = `http://localhost:${env.PORT}/delivery-partners/applications`;
const APPLICANTS = Array.from({ length: 20 }, (_, i) => 991001 + i);
const STAFF_IDS = [991101, 991102, 991103, 991104];
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

const cleanup = async () => {
  await sql("ALTER TABLE delivery_partner_zones DROP CONSTRAINT IF EXISTS rvchk_boom"); // the forced failure of E8
  const apps = await sql("SELECT id FROM delivery_partner_applications WHERE user_id IN (:ids)", { ids: APPLICANTS });
  for (const { id } of apps) fs.rmSync(path.resolve(env.STORAGE_DIR, "applications", id), { recursive: true, force: true });
  await sql("DELETE FROM delivery_partner_application_events WHERE application_id IN (SELECT id FROM delivery_partner_applications WHERE user_id IN (:ids))", { ids: APPLICANTS });
  await sql("DELETE FROM delivery_partner_applications WHERE user_id IN (:ids)", { ids: APPLICANTS });
  // Partners that approvals made, with what points at them, before the zones they stand in.
  const partners = "SELECT id FROM delivery_partners WHERE user_id IN (:ids)";
  await sql(`DELETE FROM delivery_partner_zones WHERE delivery_partner_id IN (${partners})`, { ids: APPLICANTS });
  await sql(`DELETE FROM delivery_status_history WHERE delivery_partner_id IN (${partners})`, { ids: APPLICANTS });
  await sql("DELETE FROM delivery_partners WHERE user_id IN (:ids)", { ids: APPLICANTS });
  await sql("DELETE FROM delivery_zones WHERE code LIKE 'RVCHK-%'");
};

const applicant = (n) => tokenFor(APPLICANTS[n - 1]);
const upload = (token, type, bytes, mime, fields) => call("PUT", `/me/documents/${type}`, token, { file: { bytes, mime }, fields });
const versionOf = async (id) => (await sql("SELECT version FROM delivery_partner_applications WHERE id = :id", { id }))[0].version;
const eventsOf = (id, type) => sql("SELECT * FROM delivery_partner_application_events WHERE application_id = :id AND type = :type ORDER BY created_at", { id, type });
// The service counts days on the Indian calendar (the container runs in UTC), so the check must too.
const TODAY = todayIST();
const YESTERDAY = new Date(Date.parse(TODAY) - 86_400_000).toISOString().slice(0, 10);

// A submitted application made through the real applicant routes. `n` picks the fake applicant (1-20).
const seed = async (n, { name = "Anil RvChk", cycle = false, submit = true } = {}) => {
  const token = applicant(n);
  const json = cycle ? { name, vehicle_type: "CYCLE" } : { name, vehicle_type: "BIKE", vehicle_number: `PB65 RV ${1000 + n}` };
  const created = await call("POST", "", token, { json });
  assert.equal(created.status, 201, `seed ${n}: create`);
  await upload(token, "PHOTO", JPEG, "image/jpeg");
  await upload(token, "AADHAAR", JPEG, "image/jpeg", { number: `1234 5678 ${1000 + n}` });
  if (!cycle) {
    await upload(token, "DL", JPEG, "image/jpeg", { number: `PB65 2015001${1000 + n}`, expiry_date: "2031-06-30" });
    await upload(token, "RC", JPEG, "image/jpeg");
  }
  if (submit) assert.equal((await call("POST", "/me/submit", token, { json: { consent: true } })).status, 200, `seed ${n}: submit`);
  return created.body.data.id;
};

await cleanup();
try {
  const OPS = tokenFor(991101, "OPS_STAFF");
  const ADMIN = tokenFor(991102, "ADMIN");
  const ADMIN2 = tokenFor(991103, "ADMIN");
  const SUPER = tokenFor(991104, "SUPER_ADMIN");
  const STAFF = { OPS_STAFF: OPS, ADMIN, SUPER_ADMIN: SUPER };

  // ---- who may call (the routes grow with each step; every one is listed here) ----
  const STAFF_ROUTES = [
    ["GET", ""],
    ["GET", `/${NO_ID}`],
    ["POST", `/${NO_ID}/start-review`],
    ["GET", `/${NO_ID}/documents/PHOTO/url`],
    ["POST", `/${NO_ID}/documents/PHOTO/verify`],
    ["POST", `/${NO_ID}/documents/PHOTO/request-reupload`],
    ["PUT", `/${NO_ID}/checks/ID_MATCH`],
    ["POST", `/${NO_ID}/notes`],
    ["POST", `/${NO_ID}/request-changes`],
  ];
  // Approve and reject are for admins only (D4): ops staff is turned away before the id or the body is looked at.
  const DECIDER_ROUTES = [["POST", `/${NO_ID}/reject`], ["POST", `/${NO_ID}/approve`]];
  const matrix = [...STAFF_ROUTES.map((r) => [...r, STAFF]), ...DECIDER_ROUTES.map((r) => [...r, { ADMIN, SUPER_ADMIN: SUPER }])];
  for (const [method, p, allowed] of matrix) {
    assert.equal((await call(method, p, null)).status, 401, `${method} ${p}: no token`);
    for (const role of ["CUSTOMER", "DELIVERY_PARTNER"]) {
      assert.equal((await call(method, p, tokenFor(1, role))).status, 403, `${method} ${p}: ${role} is not staff`);
    }
    for (const [role, token] of Object.entries(allowed)) {
      const { status } = await call(method, p, token);
      assert.ok(status !== 401 && status !== 403, `${method} ${p}: ${role} gets in (got ${status})`);
    }
    if (allowed !== STAFF) assert.equal((await call(method, p, OPS)).status, 403, `${method} ${p}: OPS_STAFF is not an admin`);
  }
  assert.equal((await call("GET", "/not-a-uuid", OPS)).status, 404, "a malformed id is a 404, not a 500");
  assert.equal((await call("POST", "/not-a-uuid/start-review", OPS)).status, 404);
  assert.equal((await call("GET", `/${NO_ID}`, OPS)).status, 404, "an unknown id is a 404");
  assert.equal((await call("GET", "/me", OPS)).status, 403, "/me is the applicant's route, not an id");

  // ---- queue ----
  const zone = await db.DeliveryZone.create({ code: "RVCHK-1", name: "RvChk Zone", city: "Mohali", is_active: true });
  const ids = {};
  for (let n = 1; n <= 5; n++) ids[n] = await seed(n, { name: `${["Anil", "Bimal", "Chand", "Dev", "Esha"][n - 1]} RvChk`, cycle: n === 5 });
  ids[6] = await seed(6, { name: "Farid RvChk", submit: false }); // a draft
  ids[7] = await seed(7, { name: "Gita RvChk" });
  await sql("UPDATE delivery_partner_applications SET status = 'REJECTED', decided_at = NOW() WHERE id = :id", { id: ids[7] });
  // Oldest first: 3, 1, 2, 4, 5 (Gita is rejected and Farid is a draft, so neither is in the default queue).
  const age = { 3: 50, 1: 40, 2: 30, 4: 20, 5: 10 };
  for (const [n, minutes] of Object.entries(age)) {
    await sql("UPDATE delivery_partner_applications SET submitted_at = NOW() - make_interval(mins => :m) WHERE id = :id", { m: minutes, id: ids[n] });
  }
  await sql("UPDATE delivery_partner_applications SET preferred_zone_id = :z WHERE id IN (:a, :b)", { z: zone.id, a: ids[2], b: ids[4] });
  await sql("UPDATE delivery_partner_applications SET source = 'ADMIN', created_by = 991102 WHERE id = :id", { id: ids[5] });

  const queue = (params = {}, token = OPS) => call("GET", `?${new URLSearchParams({ search: "RvChk", ...params })}`, token);
  const names = (res) => res.body.data.applications.map((a) => a.name.split(" ")[0]);

  const all = await queue({ limit: 100 });
  assert.equal(all.status, 200);
  assert.deepEqual(names(all), ["Chand", "Anil", "Bimal", "Dev", "Esha"], "oldest submission first; no draft, no rejected");
  assert.deepEqual(names(await queue({ status: "REJECTED" })), ["Gita"], "a decided status is asked for by name");
  assert.deepEqual(names(await queue({ status: "NEW" })), ["Chand", "Anil", "Bimal", "Dev", "Esha"]);
  assert.deepEqual(names(await queue({ status: "UNDER_REVIEW" })), []);
  assert.deepEqual(names(await queue({ zone_id: zone.id })), ["Bimal", "Dev"], "zone filter");
  assert.deepEqual(names(await queue({ source: "ADMIN" })), ["Esha"], "source filter");
  assert.deepEqual(names(await queue({ source: "SELF" })), ["Chand", "Anil", "Bimal", "Dev"]);
  assert.deepEqual(names(await queue({ search: "bimal" })), ["Bimal"], "name search ignores case");

  const first = all.body.data.applications[1]; // Anil
  assert.equal(first.id, ids[1]);
  assert.match(first.ref, /^FR-P-\d{4,}$/);
  assert.equal(first.phone, "••••••••001", "the queue masks the phone");
  assert.ok(!JSON.stringify(all.body).includes("99900991001"), "no full phone anywhere in the queue");
  assert.deepEqual(first.documents, { verified: 0, required: 4 });
  assert.equal(all.body.data.applications[4].documents.required, 2, "a cycle needs two documents");
  assert.equal(first.preferred_zone, null);
  assert.deepEqual(all.body.data.applications[2].preferred_zone, { id: Number(zone.id), name: "RvChk Zone" });

  // search by the digits of a phone, by the reference in its three spellings, and a wildcard is just a character
  assert.deepEqual(names(await queue({ search: "0991002" })), ["Bimal"], "phone fragment");
  const refNo = first.ref.slice("FR-P-".length);
  for (const spelling of [first.ref, `P${refNo}`, refNo]) {
    assert.ok((await queue({ search: spelling })).body.data.applications.some((a) => a.id === ids[1]), `search ${spelling}`);
  }
  assert.deepEqual(names(await queue({ search: "FR-P-999999" })), [], "unknown reference");
  for (const wild of ["%", "_", "\\", "Ani%", "A_il"]) assert.deepEqual(names(await queue({ search: wild })), [], `"${wild}" is literal`);

  // verified count: required documents only, so a verified PAN adds nothing
  await sql("UPDATE delivery_partner_documents SET status = 'VERIFIED' WHERE application_id = :id AND type IN ('PHOTO','AADHAAR')", { id: ids[1] });
  assert.deepEqual((await queue({ search: "Anil" })).body.data.applications[0].documents, { verified: 2, required: 4 });
  await sql("UPDATE delivery_partner_documents SET status = 'UPLOADED' WHERE application_id = :id", { id: ids[1] });

  // paging: no row repeated or skipped
  const pages = [];
  for (const page of [1, 2, 3]) pages.push(await queue({ limit: 2, page }));
  assert.deepEqual(pages.map((p) => names(p).length), [2, 2, 1]);
  assert.deepEqual(pages.flatMap(names), names(all));
  assert.deepEqual(pages[0].body.data.pagination, { totalItems: 5, totalPages: 3, currentPage: 1, limit: 2, hasNextPage: true, hasPrevPage: false });
  assert.deepEqual(pages[2].body.data.pagination, { totalItems: 5, totalPages: 3, currentPage: 3, limit: 2, hasNextPage: false, hasPrevPage: true });
  assert.deepEqual(names(await queue({ limit: 2, page: 9 })), [], "past the end is an empty page, not an error");

  for (const bad of [{ limit: 0 }, { limit: 101 }, { page: 0 }, { limit: "x" }, { status: "DRAFT" }, { status: "nope" }, { zone_id: "abc" }, { source: "x" }, { search: "x".repeat(101) }, { foo: 1 }]) {
    const res = await queue(bad);
    assert.equal(res.status, 400, `bad filter ${JSON.stringify(bad)}`);
    assert.ok(Array.isArray(res.body.errors) && res.body.errors.length, "the error names the field");
  }

  // ---- detail ----
  const detail = (await call("GET", `/${ids[1]}`, ADMIN)).body.data;
  const raw = JSON.stringify(detail);
  for (const hidden of ["file_key", "sha256", "number_hmac"]) assert.ok(!raw.includes(hidden), `${hidden} must not be returned`);
  assert.equal(detail.status, "NEW");
  assert.equal(detail.version, await versionOf(ids[1]));
  assert.equal(detail.phone, "99900991001", "staff see the full phone");
  assert.equal(detail.documents.length, 4);
  assert.deepEqual(detail.documents.map((d) => d.type), ["PHOTO", "AADHAAR", "DL", "RC"]);
  assert.equal(detail.documents.find((d) => d.type === "AADHAAR").number_masked, "•••• •••• 1001");
  assert.equal(detail.documents.find((d) => d.type === "DL").expiry_date, "2031-06-30");
  assert.deepEqual(detail.checks.map((c) => c.key), ["PHONE_OTP", "ID_MATCH", "DL_VALID", "RC_MATCH", "BG_CHECK", "SAFETY_BRIEFING"]);
  assert.equal(detail.checks[0].done, true);
  assert.deepEqual(detail.gaps.map((g) => g.code).sort(), [...Array(4).fill("DOC_NOT_VERIFIED"), ...Array(5).fill("CHECK_NOT_DONE")].sort());
  assert.deepEqual(detail.can_decide, { request_changes: true, reject: true, approve: false });
  assert.deepEqual((await call("GET", `/${ids[1]}`, OPS)).body.data.can_decide, { request_changes: true, reject: false, approve: false }, "ops cannot reject");
  assert.ok(detail.documents.every((d) => !d.can_verify && d.verify_blocked_by === "Start the review first" && !d.can_reupload));
  assert.equal(detail.checks[0].can_tick, false);
  assert.equal(detail.checks[0].blocked_by, "Set automatically");
  assert.equal(detail.checks.find((c) => c.key === "ID_MATCH").blocked_by, "Start the review first");
  assert.deepEqual(detail.events.map((e) => e.type), ["CREATED", "DOC_UPLOADED", "DOC_UPLOADED", "DOC_UPLOADED", "DOC_UPLOADED", "SUBMITTED"]);
  assert.equal(detail.events[0].actor_id, APPLICANTS[0], "actor ids are numbers");
  assert.equal(detail.decision, null);
  assert.equal(detail.preferred_zone, null);
  assert.deepEqual((await call("GET", `/${ids[2]}`, OPS)).body.data.preferred_zone, { id: Number(zone.id), name: "RvChk Zone", is_active: true });
  const draftDetail = (await call("GET", `/${ids[6]}`, ADMIN)).body.data;
  assert.equal(draftDetail.status, "DRAFT");
  assert.deepEqual(draftDetail.can_decide, { request_changes: false, reject: false, approve: false }, "nothing to decide on a draft");

  // ---- start review ----
  const beforeStart = await versionOf(ids[1]);
  const race = await Promise.all([call("POST", `/${ids[1]}/start-review`, ADMIN), call("POST", `/${ids[1]}/start-review`, OPS)]);
  assert.deepEqual(race.map((r) => r.status).sort(), [200, 409], "two staff start together: one wins");
  const [winner, loser] = race[0].status === 200 ? [race[0], race[1]] : [race[1], race[0]];
  const winnerId = winner.body.data.reviewer_id;
  assert.ok([991101, 991102].includes(winnerId));
  assert.equal(winner.body.data.status, "UNDER_REVIEW");
  assert.match(loser.body.message, new RegExp(`staff #${winnerId}`), "the loser is told who has it");
  assert.equal((await eventsOf(ids[1], "REVIEW_STARTED")).length, 1, "one REVIEW_STARTED event");
  assert.equal(await versionOf(ids[1]), beforeStart + 1, "starting bumps the version once");

  const winnerToken = winnerId === 991102 ? ADMIN : OPS;
  const otherToken = winnerId === 991102 ? OPS : ADMIN;
  const again = await call("POST", `/${ids[1]}/start-review`, winnerToken);
  assert.equal(again.status, 200, "the same person pressing twice");
  assert.equal((await eventsOf(ids[1], "REVIEW_STARTED")).length, 1, "and no second event");
  assert.equal(await versionOf(ids[1]), beforeStart + 1, "and no second bump");
  assert.equal((await call("POST", `/${ids[1]}/start-review`, otherToken)).status, 409, "another person after the fact");
  assert.equal((await call("POST", `/${ids[1]}/start-review`, SUPER)).status, 409);

  // the claim is advisory: the other person still sees the detail and the review actions open up
  const started = (await call("GET", `/${ids[1]}`, otherToken)).body.data;
  assert.equal(started.reviewer_id, winnerId);
  assert.ok(started.review_started_at);
  assert.ok(started.documents.find((d) => d.type === "AADHAAR" && !d.can_verify && d.verify_blocked_by === "Open the file first"));
  assert.equal(started.checks.find((c) => c.key === "ID_MATCH").blocked_by, "Photo and Aadhaar must be verified first");
  assert.equal(started.checks.find((c) => c.key === "BG_CHECK").can_tick, true, "a manual check can be ticked once the review has started");
  assert.equal(started.can_decide.reject, otherToken === ADMIN);

  // the applicant sees that the review started, and nothing about who
  const mine = (await call("GET", "/me", applicant(1))).body.data;
  const startedEvent = mine.events.find((e) => e.type === "REVIEW_STARTED");
  assert.ok(startedEvent && startedEvent.payload === null);
  assert.ok(!JSON.stringify(mine).includes(String(winnerId)), "no staff id in the applicant's view");

  // wrong statuses
  await sql("UPDATE delivery_partner_applications SET status = 'CHANGES_REQUESTED' WHERE id = :id", { id: ids[2] });
  const waiting = await call("POST", `/${ids[2]}/start-review`, ADMIN);
  assert.equal(waiting.status, 409);
  assert.equal(waiting.body.message, "Waiting for the applicant");
  assert.match((await call("POST", `/${ids[6]}/start-review`, ADMIN)).body.message, /not been submitted/);
  const beforeRefused = await versionOf(ids[7]);
  assert.match((await call("POST", `/${ids[7]}/start-review`, ADMIN)).body.message, /already decided/);
  assert.equal(await versionOf(ids[7]), beforeRefused, "refused calls never bump the version");

  // ---- documents: link, file, verify, re-upload ----
  // From here the claim is ignored on purpose (B6): ADMIN does the reviewing, OPS is "someone else".
  const detailOf = async (id, token = ADMIN) => (await call("GET", `/${id}`, token)).body.data;
  const docOf = async (id, type, token = ADMIN) => (await detailOf(id, token)).documents.find((d) => d.type === type);
  const linkFor = (id, type, token = ADMIN) => call("GET", `/${id}/documents/${type}/url`, token);
  const fetchFile = (url, headers) => fetch(`http://localhost:${env.PORT}${url}`, { headers });
  // The file has to be opened after it was uploaded, judged by two timestamps taken in Node. The Docker Desktop VM steps its clock back
  // 0.1-0.2 s every 30 s, which flipped that order a few ms apart; so the open waits. ponytail: a fixed 0.4 s per open, about 20 s per run.
  const open = async (id, type, token = ADMIN) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    assert.equal((await linkFor(id, type, token)).status, 200, `open ${type}`);
  };
  const verify = (id, type, json, token = ADMIN) => call("POST", `/${id}/documents/${type}/verify`, token, { json });
  const reupload = (id, type, json, token = ADMIN) => call("POST", `/${id}/documents/${type}/request-reupload`, token, { json });
  const docRowId = async (id, type) => (await sql("SELECT id FROM delivery_partner_documents WHERE application_id = :id AND type = :type", { id, type }))[0].id;
  const fileToken = (claims, options = { audience: "partner-file", expiresIn: 60 }, secret = env.JWT_SECRET) => jwt.sign(claims, secret, options);
  const FILES = "/delivery-partners/applications/files";

  // nothing is verified or sent back before the reviewer has opened the file (P2-7)
  assert.equal((await verify(ids[1], "PHOTO")).status, 409);
  assert.equal((await verify(ids[1], "PHOTO")).body.message, "Open the file first");
  assert.equal((await reupload(ids[1], "PHOTO", { reason: "Too dark to read" })).body.message, "Open the file first");

  const link = await linkFor(ids[1], "PHOTO");
  assert.equal(link.status, 200);
  assert.match(link.body.data.url, new RegExp(`^${FILES}/[\\w-]+\\.[\\w-]+\\.[\\w-]+$`));
  const lifetime = new Date(link.body.data.expires_at) - Date.now();
  assert.ok(lifetime > 100_000 && lifetime <= 120_000, "the link lasts 120 seconds");

  const served = await fetchFile(link.body.data.url); // no bearer token: the link is the credential
  assert.equal(served.status, 200);
  assert.ok(Buffer.from(await served.arrayBuffer()).equals(JPEG), "the bytes served are the bytes uploaded");
  assert.equal(served.headers.get("content-type"), "image/jpeg");
  assert.equal(served.headers.get("content-disposition"), 'inline; filename="document.jpeg"', "a plain name, never the token");
  assert.equal(served.headers.get("x-content-type-options"), "nosniff");
  assert.equal(served.headers.get("cache-control"), "no-store");
  assert.equal(served.headers.get("cross-origin-resource-policy"), "cross-origin", "the dashboard is another origin");
  assert.equal(served.headers.get("x-frame-options"), null);
  assert.match(served.headers.get("content-security-policy"), /^frame-ancestors /);
  assert.equal((await fetchFile(link.body.data.url)).status, 200, "the same link works again inside its window (P2-8)");
  const normal = await fetch(`${BASE}?limit=1`, { headers: { authorization: `Bearer ${ADMIN}` } });
  assert.equal(normal.headers.get("x-frame-options"), "SAMEORIGIN", "every other route keeps helmet's defaults");
  assert.equal(normal.headers.get("cross-origin-resource-policy"), "same-origin");

  // every way a link can be wrong
  const [head, payload, signature] = link.body.data.url.slice(FILES.length + 1).split(".");
  const photoRow = await docRowId(ids[1], "PHOTO");
  const refusals = {
    "garbage": "not.a.token",
    "a signature that was edited": `${head}.${payload}.${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`,
    "a login token (no audience)": ADMIN,
    "no audience": fileToken({ doc: photoRow }, { expiresIn: 60 }),
    "another audience": fileToken({ doc: photoRow }, { audience: "something-else", expiresIn: 60 }),
    "expired": fileToken({ doc: photoRow, exp: Math.floor(Date.now() / 1000) - 5 }, { audience: "partner-file" }),
    "another secret": fileToken({ doc: photoRow }, { audience: "partner-file", expiresIn: 60 }, "x".repeat(40)),
  };
  for (const [what, token] of Object.entries(refusals)) assert.equal((await fetchFile(`${FILES}/${token}`)).status, 401, what);
  assert.equal((await fetchFile(`${FILES}/${fileToken({ doc: NO_ID })}`)).status, 404, "a document that is gone");
  assert.equal((await fetchFile(`${FILES}/${fileToken({ doc: 5 })}`)).status, 404, "a claim that is not an id");
  // a file link is not a login, whatever the route
  for (const p of ["", `/${ids[1]}`, `/${ids[1]}/start-review`]) {
    assert.equal((await call(p.endsWith("review") ? "POST" : "GET", p, fileToken({ doc: photoRow }))).status, 401, `file token on ${p || "/"}`);
  }

  // opening is logged, and it is per person
  const eyes = await docOf(ids[1], "PHOTO");
  assert.ok(eyes.viewed_by_me_at && eyes.can_verify && eyes.can_reupload, "ADMIN opened it");
  const others = await docOf(ids[1], "PHOTO", OPS);
  assert.equal(others.viewed_by_me_at, null, "OPS did not");
  assert.equal(others.can_verify, false);
  assert.equal(others.verify_blocked_by, "Open the file first");
  assert.equal((await verify(ids[1], "PHOTO", undefined, OPS)).status, 409, "another person's view does not count");
  const viewEvents = await eventsOf(ids[1], "DOC_VIEWED");
  assert.ok(viewEvents.length === 1 && viewEvents[0].payload.type === "PHOTO" && String(viewEvents[0].actor_id) === "991102", "one view, by ADMIN");
  assert.ok(!(await detailOf(ids[1])).events.some((e) => e.type === "DOC_VIEWED"), "views are audit, not timeline");
  assert.equal((await linkFor(ids[1], "photo")).status, 200, "the type may be lower case");
  assert.equal((await linkFor(ids[1], "PAN")).status, 404, "no such document");
  assert.equal((await linkFor(ids[1], "XYZ")).status, 404, "no such type");

  // verify
  const beforeVerify = await versionOf(ids[1]);
  const verified = await verify(ids[1], "PHOTO");
  assert.equal(verified.status, 200);
  const verifiedPhoto = verified.body.data.documents.find((d) => d.type === "PHOTO");
  assert.equal(verifiedPhoto.status, "VERIFIED");
  assert.equal(verifiedPhoto.verified_by, 991102);
  assert.ok(verifiedPhoto.verified_at);
  assert.equal(await versionOf(ids[1]), beforeVerify + 1);
  assert.equal((await eventsOf(ids[1], "DOC_VERIFIED")).length, 1);
  assert.equal((await verify(ids[1], "PHOTO")).status, 200, "verifying twice");
  assert.equal(await versionOf(ids[1]), beforeVerify + 1, "changes nothing: no bump");
  assert.equal((await eventsOf(ids[1], "DOC_VERIFIED")).length, 1, "and no second event");
  assert.equal(verified.body.data.documents.find((d) => d.type === "PHOTO").can_verify, false);

  await open(ids[1], "AADHAAR");
  assert.equal((await verify(ids[1], "AADHAAR")).status, 200);
  await open(ids[1], "RC");
  const rcWithExpiry = await verify(ids[1], "RC", { expiry_date: "2031-06-30" });
  assert.equal(rcWithExpiry.status, 400, "only a licence has an expiry date");
  assert.equal((await verify(ids[1], "RC", { nope: 1 })).status, 400, "unknown keys are refused");
  assert.equal((await verify(ids[1], "RC")).status, 200);

  await open(ids[1], "DL");
  for (const [expiry, problem] of [["2020-01-01", /expired/], ["2099-01-01", /too far ahead/], ["2026-02-31", /real date/], ["2031-06-30T00:00:00Z", /real date/], ["30/06/2031", /real date/]]) {
    const res = await verify(ids[1], "DL", { expiry_date: expiry });
    assert.equal(res.status, 400, expiry);
    assert.match(res.body.message, problem, expiry);
  }
  assert.equal((await docOf(ids[1], "DL")).status, "UPLOADED", "none of those changed anything");
  const dl = await verify(ids[1], "DL", { expiry_date: "2031-07-01" });
  assert.equal(dl.status, 200);
  assert.equal(dl.body.data.documents.find((d) => d.type === "DL").expiry_date, "2031-07-01", "the reviewer's date wins");
  assert.equal((await eventsOf(ids[1], "DOC_VERIFIED")).length, 4);

  const checked = await detailOf(ids[1]);
  assert.deepEqual(checked.gaps.map((g) => g.code), Array(5).fill("CHECK_NOT_DONE"), "only the checks are left");
  for (const key of ["ID_MATCH", "DL_VALID", "RC_MATCH"]) assert.equal(checked.checks.find((c) => c.key === key).can_tick, true, `${key} is unlocked`);

  // a number that was never typed, and a licence with no date at all
  ids[8] = await seed(8, { name: "Hari RvChk" });
  assert.equal((await call("POST", `/${ids[8]}/start-review`, ADMIN)).status, 200);
  await sql("UPDATE delivery_partner_documents SET number_masked = NULL WHERE application_id = :id AND type = 'AADHAAR'", { id: ids[8] });
  await sql("UPDATE delivery_partner_documents SET expiry_date = NULL WHERE application_id = :id AND type = 'DL'", { id: ids[8] });
  await open(ids[8], "AADHAAR");
  const noNumber = await verify(ids[8], "AADHAAR");
  assert.equal(noNumber.status, 400);
  assert.equal(noNumber.body.message, "The applicant has not entered the Aadhaar number");
  await open(ids[8], "DL");
  const noDate = await verify(ids[8], "DL");
  assert.equal(noDate.status, 400);
  assert.equal(noDate.body.message, "Enter the licence expiry date");
  assert.equal((await verify(ids[8], "DL", { expiry_date: "2031-07-01" })).status, 200, "the reviewer supplies the date");

  // ask to re-upload: one document, and the application goes back to the applicant (P2-1)
  const beforeReupload = await detailOf(ids[8]);
  assert.equal((await reupload(ids[8], "PHOTO", { reason: "Too dark to read" })).body.message, "Open the file first");
  await open(ids[8], "PHOTO");
  assert.equal((await reupload(ids[8], "PHOTO", { reason: "x" })).status, 400, "reason of 3 or more characters");
  assert.equal((await reupload(ids[8], "PHOTO")).status, 400, "reason is required");
  assert.equal((await reupload(ids[8], "PHOTO", { reason: "Too dark to read", extra: 1 })).status, 400);
  assert.equal((await detailOf(ids[8])).status, "UNDER_REVIEW", "400s changed nothing");
  const sent = await reupload(ids[8], "PHOTO", { reason: "Too dark to read" });
  assert.equal(sent.status, 200);
  assert.equal(sent.body.data.status, "CHANGES_REQUESTED");
  assert.equal(sent.body.data.reviewer_id, beforeReupload.reviewer_id, "the claim stays with the same person");
  assert.equal(sent.body.data.version, beforeReupload.version + 1, "the move bumps the version once");
  const rejectedPhoto = sent.body.data.documents.find((d) => d.type === "PHOTO");
  assert.equal(rejectedPhoto.status, "REJECTED");
  assert.equal(rejectedPhoto.reject_reason, "Too dark to read");
  assert.deepEqual(sent.body.data.can_decide, { request_changes: false, reject: true, approve: false }, "only NO_RESPONSE reject is left");

  await open(ids[8], "AADHAAR");
  assert.equal((await reupload(ids[8], "AADHAAR", { reason: "Blurry" })).body.message, "Waiting for the applicant", "a second request has to wait (P2-11)");
  assert.equal((await verify(ids[8], "AADHAAR")).body.message, "Waiting for the applicant");
  assert.equal((await eventsOf(ids[8], "DOC_REJECTED")).length, 1, "one request, one event");

  const seen = (await call("GET", "/me", applicant(8))).body.data;
  assert.equal(seen.status, "CHANGES_REQUESTED");
  assert.equal(seen.documents.find((d) => d.type === "PHOTO").reject_reason, "Too dark to read");
  assert.deepEqual(seen.events.find((e) => e.type === "DOC_REJECTED").payload, { type: "PHOTO", reason: "Too dark to read" });
  assert.ok(!JSON.stringify(seen).includes("991102"), "no staff id in the applicant's view");

  assert.equal((await call("POST", "/me/resubmit", applicant(8))).status, 400, "the photo is still the rejected one");
  assert.equal((await upload(applicant(8), "PHOTO", JPEG, "image/jpeg")).status, 200);
  assert.equal((await call("POST", "/me/resubmit", applicant(8))).status, 200);
  const back = await detailOf(ids[8]);
  assert.equal(back.status, "UNDER_REVIEW");
  assert.equal(back.reviewer_id, 991102, "back to the same reviewer");
  assert.equal(back.documents.find((d) => d.type === "PHOTO").status, "UPLOADED", "a new file starts unreviewed");
  assert.equal(back.documents.find((d) => d.type === "PHOTO").can_verify, false, "and the old look at the old file does not count");

  // several bad documents at once: one wins, one text, one event (P2-11)
  ids[9] = await seed(9, { name: "Ila RvChk" });
  await call("POST", `/${ids[9]}/start-review`, ADMIN);
  await open(ids[9], "PHOTO");
  await open(ids[9], "AADHAAR");
  const pair = await Promise.all([reupload(ids[9], "PHOTO", { reason: "Dark" }), reupload(ids[9], "AADHAAR", { reason: "Blurry" })]);
  assert.deepEqual(pair.map((r) => r.status).sort(), [200, 409]);
  assert.equal((await eventsOf(ids[9], "DOC_REJECTED")).length, 1);
  assert.equal((await sql("SELECT count(*)::int AS n FROM delivery_partner_documents WHERE application_id = :id AND status = 'REJECTED'", { id: ids[9] }))[0].n, 1);

  // a file that is missing, and one that cannot be decrypted
  const [rcRow] = await sql("SELECT id, file_key FROM delivery_partner_documents WHERE application_id = :id AND type = 'RC'", { id: ids[9] });
  const [dlRow] = await sql("SELECT id, file_key FROM delivery_partner_documents WHERE application_id = :id AND type = 'DL'", { id: ids[9] });
  fs.rmSync(path.resolve(env.STORAGE_DIR, rcRow.file_key));
  assert.equal((await fetchFile(`${FILES}/${fileToken({ doc: rcRow.id })}`)).status, 404, "file gone from disk");
  fs.writeFileSync(path.resolve(env.STORAGE_DIR, dlRow.file_key), Buffer.alloc(64, 7));
  const broken = await fetchFile(`${FILES}/${fileToken({ doc: dlRow.id })}`);
  assert.equal(broken.status, 500, "cannot be decrypted");
  assert.ok(!JSON.stringify(await broken.json()).includes(dlRow.file_key), "and says nothing about where the file is");

  // ---- checks ----
  const tick = (id, key, json, token = ADMIN) => call("PUT", `/${id}/checks/${key}`, token, { json });
  const checkOf = async (id, key) => (await detailOf(id)).checks.find((c) => c.key === key);
  const count = async (id, type) => (await eventsOf(id, type)).length;

  assert.equal((await tick(ids[1], "PHONE_OTP", { done: false })).body.message, "Set automatically");
  assert.equal((await tick(ids[1], "PHONE_OTP", { done: false })).status, 400, "proven by the token, never by hand");
  assert.equal((await tick(ids[1], "PHONE_OTP", { done: true })).status, 400);
  assert.equal((await tick(ids[1], "NOPE", { done: true })).status, 404, "no such check");
  for (const bad of [{}, { done: "yes" }, { done: true, note: "x" }, { done: true, extra: 1 }]) {
    assert.equal((await tick(ids[1], "BG_CHECK", bad)).status, 400, JSON.stringify(bad));
  }

  // what each tick needs, one failing case per row of the dependency table
  ids[10] = await seed(10, { name: "Jai RvChk" });
  await call("POST", `/${ids[10]}/start-review`, ADMIN);
  const needs = async (key, message) => {
    const res = await tick(ids[10], key, { done: true, note: "REF-1" });
    assert.equal(res.status, 409, key);
    assert.equal(res.body.message, message, key);
    assert.equal((await checkOf(ids[10], key)).done, false, `${key} stayed unticked`);
  };
  await needs("ID_MATCH", "Photo and Aadhaar must be verified first");
  await needs("DL_VALID", "Driving licence must be verified first");
  await needs("RC_MATCH", "Vehicle RC must be verified first");
  await open(ids[10], "PHOTO");
  assert.equal((await verify(ids[10], "PHOTO")).status, 200);
  await needs("ID_MATCH", "Aadhaar must be verified first");
  await open(ids[10], "AADHAAR");
  assert.equal((await verify(ids[10], "AADHAAR")).status, 200);
  assert.equal((await tick(ids[10], "id_match", { done: true })).status, 200, "the key may be lower case");
  await open(ids[10], "DL");
  assert.equal((await verify(ids[10], "DL", { expiry_date: "2031-07-01" })).status, 200);
  await sql("UPDATE delivery_partner_documents SET expiry_date = :day WHERE application_id = :id AND type = 'DL'", { id: ids[10], day: YESTERDAY });
  await needs("DL_VALID", "The licence has expired");
  await sql("UPDATE delivery_partner_documents SET expiry_date = NULL WHERE application_id = :id AND type = 'DL'", { id: ids[10] });
  await needs("DL_VALID", "The licence has no expiry date");
  await sql("UPDATE delivery_partner_documents SET expiry_date = :day WHERE application_id = :id AND type = 'DL'", { id: ids[10], day: TODAY });
  assert.equal((await tick(ids[10], "DL_VALID", { done: true })).status, 200, "a licence that expires today is still valid");
  const noRef = await tick(ids[10], "BG_CHECK", { done: true });
  assert.equal(noRef.status, 400, "a background check needs its reference");
  assert.equal(noRef.body.message, "Add the background check reference");
  assert.equal((await tick(ids[10], "SAFETY_BRIEFING", { done: true })).status, 200, "the briefing needs nothing");

  // a cycle has no DL_VALID or RC_MATCH
  ids[11] = await seed(11, { name: "Kiran RvChk", cycle: true });
  await call("POST", `/${ids[11]}/start-review`, ADMIN);
  for (const key of ["DL_VALID", "RC_MATCH"]) {
    const res = await tick(ids[11], key, { done: true });
    assert.equal(res.status, 404, key);
    assert.equal(res.body.message, "This check does not apply to this vehicle");
  }
  assert.deepEqual((await detailOf(ids[11])).checks.map((c) => c.key), ["PHONE_OTP", "ID_MATCH", "BG_CHECK", "SAFETY_BRIEFING"]);

  // the same state twice changes nothing; the other direction is a real change
  const beforeTick = await versionOf(ids[1]);
  const ticked = await tick(ids[1], "ID_MATCH", { done: true });
  assert.equal(ticked.status, 200);
  const idMatch = ticked.body.data.checks.find((c) => c.key === "ID_MATCH");
  assert.deepEqual([idMatch.done, idMatch.done_by, idMatch.can_tick], [true, 991102, true]);
  assert.ok(idMatch.done_at);
  assert.equal(await versionOf(ids[1]), beforeTick + 1);
  assert.equal(await count(ids[1], "CHECK_DONE"), 1);
  assert.equal((await tick(ids[1], "ID_MATCH", { done: true, note: "again" })).status, 200, "ticking twice");
  assert.equal(await versionOf(ids[1]), beforeTick + 1, "is not a change: no bump");
  assert.equal(await count(ids[1], "CHECK_DONE"), 1, "and no second event");
  assert.equal((await checkOf(ids[1], "ID_MATCH")).note, null, "and the note stays as it was");
  assert.equal((await tick(ids[1], "ID_MATCH", { done: false })).status, 200);
  assert.equal(await count(ids[1], "CHECK_UNDONE"), 1);
  assert.equal((await tick(ids[1], "ID_MATCH", { done: false })).status, 200, "unticking twice");
  assert.equal(await count(ids[1], "CHECK_UNDONE"), 1);
  assert.equal(await versionOf(ids[1]), beforeTick + 2);

  // chain every call off the previous response only (A7), until nothing is left to do
  for (const [key, json] of [["ID_MATCH", { done: true }], ["DL_VALID", { done: true }], ["RC_MATCH", { done: true }], ["BG_CHECK", { done: true, note: "BGV-77" }], ["SAFETY_BRIEFING", { done: true }]]) {
    assert.equal((await tick(ids[1], key, json)).status, 200, key);
  }
  const chained = await detailOf(ids[1]);
  assert.deepEqual(chained.gaps, []);
  assert.deepEqual(chained.warnings, []);
  assert.equal(chained.checks.find((c) => c.key === "BG_CHECK").note, "BGV-77");
  assert.deepEqual(chained.can_decide, { request_changes: true, reject: true, approve: true });
  assert.equal((await detailOf(ids[1], OPS)).can_decide.approve, false, "ops never approves");

  // ticks in the wrong status
  for (const [n, message] of [[3, "Start the review first"], [2, "Waiting for the applicant"], [6, "This application has not been submitted"], [7, "This application was already decided"]]) {
    const res = await tick(ids[n], "SAFETY_BRIEFING", { done: true });
    assert.equal(res.status, 409, `application ${n}`);
    assert.equal(res.body.message, message);
  }

  // notes: any status, any staff, never the applicant's business, never a version bump
  const beforeNote = await versionOf(ids[1]);
  for (const n of [1, 2, 3, 6, 7]) {
    const note = await call("POST", `/${ids[n]}/notes`, n === 3 ? OPS : ADMIN, { json: { text: `ZZ-secret-note ${n}` } });
    assert.equal(note.status, 201, `note on application ${n}`);
    // Found by its text, not as "the last event": events are ordered by a timestamp, and a clock step can put an earlier event after it.
    const mine = note.body.data.events.filter((e) => e.type === "NOTE" && e.payload.text === `ZZ-secret-note ${n}`);
    assert.equal(mine.length, 1, `note on application ${n} is in the timeline once`);
    assert.equal(mine[0].visible_to_applicant, false);
  }
  assert.equal(await versionOf(ids[1]), beforeNote, "a note is not a change");
  for (const bad of [{}, { text: "" }, { text: " " }, { text: "x".repeat(2001) }, { text: "ok", extra: 1 }]) {
    assert.equal((await call("POST", `/${ids[1]}/notes`, ADMIN, { json: bad })).status, 400, JSON.stringify(bad));
  }
  assert.ok(!JSON.stringify((await call("GET", "/me", applicant(1))).body).includes("ZZ-secret-note"), "the applicant never sees a note");

  // the applicant is told, in so many words, that a file cannot be swapped under review (C3)
  const swap = await upload(applicant(10), "PHOTO", JPEG, "image/jpeg");
  assert.equal(swap.status, 409);
  assert.equal(swap.body.message, "Your application is being reviewed. We will ask if a document needs replacing.");
  assert.equal((await call("PATCH", "/me", applicant(10), { json: { name: "Someone Else" } })).status, 409);

  // evidence changes: the checks that rested on it come undone (D2)
  const beforeBack = await detailOf(ids[1]);
  assert.equal((await reupload(ids[1], "PHOTO", { reason: "Photo is blurred" })).status, 200);
  assert.equal((await checkOf(ids[1], "ID_MATCH")).done, false, "sending the photo back un-ticks ID_MATCH");
  const undone = (await eventsOf(ids[1], "CHECK_UNDONE")).map((e) => e.payload);
  assert.deepEqual(undone.at(-1), { key: "ID_MATCH", because: "Photo was sent back" });
  for (const key of ["DL_VALID", "RC_MATCH", "BG_CHECK", "SAFETY_BRIEFING"]) assert.equal((await checkOf(ids[1], key)).done, true, `${key} untouched`);

  const me = applicant(1);
  assert.equal((await upload(me, "DL", JPEG, "image/jpeg", { expiry_date: "2031-07-01" })).status, 200);
  assert.equal((await checkOf(ids[1], "DL_VALID")).done, false, "a replaced licence un-ticks DL_VALID");
  assert.equal((await eventsOf(ids[1], "CHECK_UNDONE")).at(-1).payload.because, "DL was replaced by the applicant");
  assert.equal((await checkOf(ids[1], "RC_MATCH")).done, true, "the RC was not touched");

  const typeChange = await call("PATCH", "/me", me, { json: { vehicle_type: "CYCLE" } });
  assert.equal(typeChange.status, 409);
  assert.equal(typeChange.body.message, "The vehicle type cannot be changed after you have applied");
  assert.equal((await call("PATCH", "/me", me, { json: { vehicle_type: "BIKE", email: "ravi@example.com" } })).status, 200, "the same type is fine");
  assert.equal((await call("PATCH", "/me", me, { json: { vehicle_number: "pb65rv1001" } })).status, 200);
  assert.equal((await checkOf(ids[1], "RC_MATCH")).done, true, "the same plate in other spacing is the same vehicle");
  assert.equal((await call("PATCH", "/me", me, { json: { vehicle_number: "PB65 RV 9999" } })).status, 200);
  assert.equal((await checkOf(ids[1], "RC_MATCH")).done, false, "a different plate un-ticks RC_MATCH");
  for (const key of ["BG_CHECK", "SAFETY_BRIEFING"]) assert.equal((await checkOf(ids[1], key)).done, true, `${key} is manual and stays`);
  assert.equal((await eventsOf(ids[1], "CHECK_UNDONE")).length, undone.length + 2, "one event per check that really changed");
  assert.deepEqual((await call("GET", "/me", me)).body.data.checks.find((c) => c.key === "RC_MATCH"), { key: "RC_MATCH", done: false });
  assert.ok((await detailOf(ids[1])).version > beforeBack.version);

  // a rejected optional document does not hold up the resubmit (P2-10); a rejected required one does
  await sql(
    `INSERT INTO delivery_partner_documents (id, application_id, type, status, file_key, mime, size_bytes, sha256, reject_reason, uploaded_at)
     VALUES (gen_random_uuid(), :id, 'PAN', 'REJECTED', 'applications/none/pan.jpg', 'image/jpeg', 1, 'x', 'blurred', NOW())`,
    { id: ids[1] }
  );
  const held = await call("POST", "/me/resubmit", me);
  assert.equal(held.status, 400);
  assert.match(held.body.message, /PHOTO/);
  assert.ok(!held.body.message.includes("PAN"), "only the required document is named");
  assert.equal((await upload(me, "PHOTO", JPEG, "image/jpeg")).status, 200);
  assert.equal((await call("POST", "/me/resubmit", me)).status, 200, "the rejected PAN does not block");
  assert.equal((await detailOf(ids[1])).status, "UNDER_REVIEW");

  // ---- decisions: request changes, reject, approve ----
  const decide = (id, action, json, token = ADMIN) => call("POST", `/${id}/${action}`, token, { json });
  const requestChanges = (id, json, token) => decide(id, "request-changes", json, token);
  const reject = (id, json, token) => decide(id, "reject", json, token);
  const approve = (id, json, token) => decide(id, "approve", json, token);
  const row = async (id) => (await sql("SELECT status, version, reviewer_id, decided_by, decided_at, decision_reason, decision_note, partner_id FROM delivery_partner_applications WHERE id = :id", { id }))[0];
  const partnersOf = (n) => sql("SELECT * FROM delivery_partners WHERE user_id = :user", { user: APPLICANTS[n - 1] });
  const heard = async (n) => JSON.stringify((await call("GET", "/me", applicant(n))).body); // everything the applicant is shown
  const zoneOff = await db.DeliveryZone.create({ code: "RVCHK-2", name: "RvChk Off", city: "Mohali", is_active: false });
  const zoneTwo = await db.DeliveryZone.create({ code: "RVCHK-3", name: "RvChk Two", city: "Mohali", is_active: true });
  const approval = async (id, extra = {}) => ({ zone_id: Number(zone.id), max_active_orders: 4, expected_version: await versionOf(id), ...extra });

  // Takes a submitted application to "nothing left to do" through the real routes: review started (idempotent for the same
  // person), every required document opened and verified, every applicable check ticked.
  const finish = async (id, cycle = false) => {
    assert.equal((await call("POST", `/${id}/start-review`, ADMIN)).status, 200, "finish: start");
    for (const type of cycle ? ["PHOTO", "AADHAAR"] : ["PHOTO", "AADHAAR", "DL", "RC"]) {
      await open(id, type);
      const res = await verify(id, type);
      assert.equal(res.status, 200, `finish: verify ${type}: ${res.body?.message}`);
    }
    for (const key of [...(cycle ? ["ID_MATCH"] : ["ID_MATCH", "DL_VALID", "RC_MATCH"]), "BG_CHECK", "SAFETY_BRIEFING"]) {
      const res = await tick(id, key, { done: true, note: "BGV-1" });
      assert.equal(res.status, 200, `finish: ${key}: ${res.body?.message}`);
    }
    assert.deepEqual((await detailOf(id)).gaps, [], "finish: nothing left");
    return id;
  };
  const ready = async (n, options = {}) => finish(await seed(n, options), options.cycle);

  // -- request changes --
  const MESSAGE = "Please send a clearer photo of yourself";
  ids[12] = await seed(12, { name: "Lata RvChk" }); // NEW and never claimed
  const v12 = await versionOf(ids[12]);
  for (const bad of [
    {}, { message: MESSAGE }, { expected_version: v12 }, { message: "ok", expected_version: v12 }, { message: "x".repeat(1001), expected_version: v12 },
    { message: MESSAGE, expected_version: "x" }, { message: MESSAGE, expected_version: -1 }, { message: MESSAGE, items: ["VOTER_ID"], expected_version: v12 },
    { message: MESSAGE, items: ["PHOTO", "PHOTO"], expected_version: v12 }, { message: MESSAGE, items: "PHOTO", expected_version: v12 },
    { message: MESSAGE, expected_version: v12, extra: 1 },
  ]) assert.equal((await requestChanges(ids[12], bad)).status, 400, JSON.stringify(bad));
  const stale = await requestChanges(ids[12], { message: MESSAGE, expected_version: v12 + 1 });
  assert.equal(stale.status, 409, "another screen's number is stale");
  assert.deepEqual(stale.body.errors, { version: v12 }, "and the 409 carries the version to reload");
  const noPan = await requestChanges(ids[12], { message: MESSAGE, items: ["PAN"], expected_version: v12 });
  assert.deepEqual([noPan.status, noPan.body.message], [400, "PAN has not been uploaded"], "an item must be a document that exists");
  assert.deepEqual([(await row(ids[12])).status, await versionOf(ids[12])], ["NEW", v12], "none of those changed anything");

  // straight from NEW, by ops staff (B2): the claim is taken here, with no REVIEW_STARTED
  const sentBack = await requestChanges(ids[12], { message: MESSAGE, items: ["PHOTO", "name"], expected_version: v12 }, OPS);
  assert.equal(sentBack.status, 200);
  const asked = sentBack.body.data;
  assert.deepEqual([asked.status, asked.reviewer_id, asked.version], ["CHANGES_REQUESTED", 991101, v12 + 1]);
  assert.deepEqual(asked.documents.map((d) => d.status), ["REJECTED", "UPLOADED", "UPLOADED", "UPLOADED"], "only the named document goes back (F1)");
  assert.equal(asked.documents[0].reject_reason, MESSAGE);
  assert.deepEqual(asked.can_decide, { request_changes: false, reject: false, approve: false }, "ops cannot reject, and the applicant has the move");
  assert.equal(await count(ids[12], "REVIEW_STARTED"), 0);
  const [askEvent] = await eventsOf(ids[12], "CHANGES_REQUESTED");
  assert.deepEqual([askEvent.visible_to_applicant, askEvent.actor_role, askEvent.payload], [true, "OPS_STAFF", { message: MESSAGE, items: ["PHOTO", "name"] }]);
  const told = (await call("GET", "/me", applicant(12))).body.data;
  assert.equal(told.status, "CHANGES_REQUESTED");
  assert.deepEqual(told.events.find((e) => e.type === "CHANGES_REQUESTED").payload, { message: MESSAGE, items: ["PHOTO", "name"] });
  assert.equal(told.documents.find((d) => d.type === "PHOTO").reject_reason, MESSAGE);
  assert.ok(!(await heard(12)).includes("991101"), "no staff id in the applicant's view (F7)");

  const twice = await requestChanges(ids[12], { message: "And the licence too", expected_version: v12 + 1 }, ADMIN);
  assert.deepEqual([twice.status, twice.body.message], [409, "Waiting for the applicant"], "a second request would overwrite the first (B5)");
  assert.equal(await count(ids[12], "CHANGES_REQUESTED"), 1);

  // the applicant fixes it and the same person gets it back; another staff member may act on that claim (B6)
  assert.equal((await upload(applicant(12), "PHOTO", JPEG, "image/jpeg")).status, 200);
  assert.equal((await call("POST", "/me/resubmit", applicant(12))).status, 200);
  const resubmitted = await detailOf(ids[12]);
  assert.deepEqual([resubmitted.status, resubmitted.reviewer_id], ["UNDER_REVIEW", 991101]);
  await open(ids[12], "PHOTO");
  assert.equal((await verify(ids[12], "PHOTO")).status, 200, "ADMIN verifies on OPS's claim");

  // several documents in one request: all go back with one text, and what rested on them comes undone (F1, F5, D2)
  ids[13] = await ready(13, { name: "Mohan RvChk" });
  const v13 = await versionOf(ids[13]);
  const three = await requestChanges(ids[13], { message: "Three files need replacing", items: ["PHOTO", "AADHAAR", "DL"], expected_version: v13 });
  assert.equal(three.status, 200);
  assert.deepEqual(three.body.data.documents.map((d) => [d.type, d.status]), [["PHOTO", "REJECTED"], ["AADHAAR", "REJECTED"], ["DL", "REJECTED"], ["RC", "VERIFIED"]]);
  assert.ok(three.body.data.documents.filter((d) => d.status === "REJECTED").every((d) => d.reject_reason === "Three files need replacing" && d.verified_by === null));
  assert.deepEqual(
    Object.fromEntries(three.body.data.checks.map((c) => [c.key, c.done])),
    { PHONE_OTP: true, ID_MATCH: false, DL_VALID: false, RC_MATCH: true, BG_CHECK: true, SAFETY_BRIEFING: true },
    "ID_MATCH and DL_VALID come undone; the manual checks stay (D7)"
  );
  assert.equal(await count(ids[13], "CHECK_UNDONE"), 2, "one event per check that really came undone");
  assert.equal(await count(ids[13], "CHANGES_REQUESTED"), 1, "one text, one event");
  assert.equal(three.body.data.version, v13 + 1, "one bump for the whole request");

  // a detail the applicant must fix is only listed; their own edit then undoes what depended on it (D2)
  ids[14] = await ready(14, { name: "Nitin RvChk" });
  const askName = await requestChanges(ids[14], { message: "Your name does not match your Aadhaar", items: ["name"], expected_version: await versionOf(ids[14]) });
  assert.equal(askName.status, 200);
  assert.equal(askName.body.data.checks.find((c) => c.key === "ID_MATCH").done, true, "asking is not changing: nothing comes undone yet");
  assert.ok(askName.body.data.documents.every((d) => d.status === "VERIFIED"), "and no document is touched");
  assert.equal((await call("PATCH", "/me", applicant(14), { json: { name: "Nitin Kumar RvChk" } })).status, 200);
  assert.equal((await checkOf(ids[14], "ID_MATCH")).done, false, "the new name undoes ID_MATCH");
  assert.equal((await checkOf(ids[14], "BG_CHECK")).done, true);
  assert.equal(await count(ids[14], "CHECK_UNDONE"), 1);

  // -- reject --
  const REASON = { reason_code: "ID_MISMATCH", note: "ZZ-reject-note: the Aadhaar belongs to someone else" };
  const v3 = await versionOf(ids[3]); // NEW: straight from the queue is allowed (B2)
  for (const bad of [
    {}, { ...REASON }, { reason_code: REASON.reason_code, expected_version: v3 }, { note: REASON.note, expected_version: v3 },
    { ...REASON, reason_code: "BECAUSE", expected_version: v3 }, { ...REASON, note: "ab", expected_version: v3 },
    { reason_code: "OTHER", note: "too short", expected_version: v3 }, { ...REASON, expected_version: v3, extra: 1 },
  ]) assert.equal((await reject(ids[3], bad)).status, 400, JSON.stringify(bad));
  assert.equal((await reject(ids[3], { ...REASON, expected_version: v3 }, OPS)).status, 403, "ops cannot reject");
  const staleReject = await reject(ids[3], { ...REASON, expected_version: v3 + 1 });
  assert.deepEqual([staleReject.status, staleReject.body.errors], [409, { version: v3 }]);
  assert.deepEqual([(await row(ids[3])).status, await versionOf(ids[3])], ["NEW", v3], "none of those changed anything");

  const rejected = await reject(ids[3], { ...REASON, expected_version: v3 });
  assert.equal(rejected.status, 200);
  assert.deepEqual([rejected.body.data.status, rejected.body.data.version, rejected.body.data.reviewer_id], ["REJECTED", v3 + 1, 991102]);
  const decision = rejected.body.data.decision;
  assert.deepEqual([decision.decided_by, decision.reason_code, decision.note, decision.partner_id], [991102, "ID_MISMATCH", REASON.note, null]);
  assert.ok(decision.decided_at);
  assert.equal(await count(ids[3], "REVIEW_STARTED"), 0);
  const [rejectEvent] = await eventsOf(ids[3], "REJECTED");
  assert.deepEqual([rejectEvent.visible_to_applicant, rejectEvent.payload], [true, null], "visible, and carries nothing");
  const shown = await heard(3); // F3, F7: the applicant learns that a decision was made and when they may apply again
  for (const secret of ["ZZ-reject-note", "ID_MISMATCH", "991102"]) assert.ok(!shown.includes(secret), `the applicant never sees ${secret}`);
  assert.equal((await call("GET", "/me", applicant(3))).body.data.status, "REJECTED");
  const cooling = await call("POST", "", applicant(3), { json: { name: "Chand Again", vehicle_type: "CYCLE" } });
  assert.equal(cooling.status, 403);
  assert.equal(cooling.body.message, `You can apply again after ${todayIST(reapplyDate((await row(ids[3])).decided_at))}`, "30 days from the decision, on the Indian calendar (B8)");

  const beforeTwice = await versionOf(ids[3]);
  const rejectedTwice = await reject(ids[3], { ...REASON, expected_version: beforeTwice });
  assert.deepEqual([rejectedTwice.status, rejectedTwice.body.message], [409, "This application was already decided"], "a double click (A6)");
  assert.equal(await count(ids[3], "REJECTED"), 1);
  assert.equal(await versionOf(ids[3]), beforeTwice);
  assert.equal((await upload(applicant(3), "PHOTO", JPEG, "image/jpeg")).status, 404, "a decided application is no longer open to its applicant (B7)");

  // under review, with OTHER (it needs a real sentence), by a super admin; the claim stays with whoever had it
  const other = await reject(ids[12], { reason_code: "OTHER", note: "Not taking riders in this area right now", expected_version: await versionOf(ids[12]) }, SUPER);
  assert.equal(other.status, 200);
  assert.deepEqual([other.body.data.status, other.body.data.reviewer_id, other.body.data.decision.decided_by], ["REJECTED", 991101, 991104]);

  // a silent applicant can be closed out, and only for that reason (P2-3, B4)
  const wrongReason = await reject(ids[13], { reason_code: "DUPLICATE", note: "Already registered", expected_version: await versionOf(ids[13]) });
  assert.deepEqual([wrongReason.status, wrongReason.body.message], [400, "While the applicant is fixing things, the only reason to reject is No response"]);
  assert.equal((await row(ids[13])).status, "CHANGES_REQUESTED");
  const silent = await reject(ids[13], { reason_code: "NO_RESPONSE", note: "No reply after 14 days", expected_version: await versionOf(ids[13]) });
  assert.deepEqual([silent.status, silent.body.data.status], [200, "REJECTED"]);

  // each status answers a decision with its own sentence, and a refusal never bumps the version (B1, B3, B7)
  const bodyFor = async (action, id) => {
    const expected_version = await versionOf(id);
    return {
      approve: { zone_id: Number(zone.id), max_active_orders: 3, expected_version },
      reject: { reason_code: "DUPLICATE", note: "Already registered", expected_version },
      "request-changes": { message: "Please fix this", expected_version },
    }[action];
  };
  const STARTED = "Start the review first", WAITING = "Waiting for the applicant", DRAFTED = "This application has not been submitted", DECIDED = "This application was already decided";
  for (const [n, action, message] of [
    [4, "approve", STARTED], [9, "approve", WAITING], [9, "request-changes", WAITING],
    [6, "approve", DRAFTED], [6, "reject", DRAFTED], [6, "request-changes", DRAFTED],
    [7, "approve", DECIDED], [7, "reject", DECIDED], [7, "request-changes", DECIDED],
  ]) {
    const before = await versionOf(ids[n]);
    const res = await decide(ids[n], action, await bodyFor(action, ids[n]));
    assert.deepEqual([res.status, res.body.message], [409, message], `${action} on application ${n}`);
    assert.equal(await versionOf(ids[n]), before);
  }

  // -- approve --
  // the gaps, all at once, including the zone (E1, E2)
  const gappy = await approve(ids[10], await approval(ids[10], { zone_id: Number(zoneOff.id) }));
  assert.deepEqual([gappy.status, gappy.body.message], [400, "Cannot approve yet"]);
  assert.deepEqual(gappy.body.errors.map((g) => g.code).sort(), ["CHECK_NOT_DONE", "CHECK_NOT_DONE", "DOC_NOT_VERIFIED", "ZONE_INVALID"]);
  assert.ok(gappy.body.errors.every((g) => g.message), "each gap says what to do");
  assert.equal((await partnersOf(10)).length, 0);
  assert.equal((await row(ids[10])).status, "UNDER_REVIEW");

  // validation, then a switched-off or unknown zone, and a partner made through the direct route in between (E3, E2, E5)
  ids[20] = await ready(20, { name: "Sunil RvChk" });
  await sql("UPDATE delivery_partner_applications SET preferred_zone_id = :z WHERE id = :id", { z: zone.id, id: ids[20] });
  const ok20 = await approval(ids[20], { max_active_orders: 3 });
  for (const bad of [
    {}, { zone_id: ok20.zone_id, expected_version: ok20.expected_version }, { max_active_orders: 3, expected_version: ok20.expected_version },
    { ...ok20, max_active_orders: 0 }, { ...ok20, max_active_orders: 11 }, { ...ok20, max_active_orders: 2.5 }, { ...ok20, max_active_orders: "x" },
    { ...ok20, zone_id: 0 }, { ...ok20, zone_id: "x" }, { ...ok20, note: "x".repeat(1001) }, { ...ok20, extra: 1 },
  ]) assert.equal((await approve(ids[20], bad)).status, 400, JSON.stringify(bad));
  const gapsOf = async (extra) => {
    const res = await approve(ids[20], await approval(ids[20], extra));
    return [res.status, (res.body.errors ?? []).map((g) => g.code)];
  };
  assert.deepEqual(await gapsOf({ zone_id: 999999999 }), [400, ["ZONE_INVALID"]], "no such zone");
  assert.deepEqual(await gapsOf({ zone_id: Number(zoneOff.id) }), [400, ["ZONE_INVALID"]], "a zone switched off after the page loaded");
  await db.DeliveryPartner.create({ user_id: APPLICANTS[19], name: "Direct", phone: "99900991020", vehicle_type: "BIKE", vehicle_number: "ZZ00 DIRECT 1", zone_id: Number(zone.id), max_active_orders: 2, status: "ACTIVE" });
  assert.deepEqual(await gapsOf({}), [400, ["PARTNER_EXISTS"]], "a partner row for this person already exists");
  await sql("DELETE FROM delivery_partners WHERE user_id = :u", { u: APPLICANTS[19] });
  assert.deepEqual([(await row(ids[20])).status, await versionOf(ids[20])], ["UNDER_REVIEW", ok20.expected_version], "none of those changed anything");

  // a zone other than the applicant's choice is fine, and 10 is the top of the range (E2, E3)
  const asTwo = await approve(ids[20], await approval(ids[20], { zone_id: Number(zoneTwo.id), max_active_orders: 10 }));
  assert.equal(asTwo.status, 201);
  const [partnerTwo] = await partnersOf(20);
  assert.deepEqual([partnerTwo.zone_id, partnerTwo.max_active_orders], [Number(zoneTwo.id), 10]);
  assert.deepEqual((await sql("SELECT zone_id::text AS zone_id, is_primary FROM delivery_partner_zones WHERE delivery_partner_id = :p", { p: partnerTwo.id })), [{ zone_id: String(zoneTwo.id), is_primary: true }]);

  // a cycle has no plate, so it is stored as none and the plate checks are skipped
  await finish(ids[11], true);
  assert.equal((await approve(ids[11], await approval(ids[11]))).status, 201);
  const [cyclePartner] = await partnersOf(11);
  assert.deepEqual([cyclePartner.vehicle_type, cyclePartner.vehicle_number], ["CYCLE", null]);

  // the whole path for one application: not an admin, a failure halfway, a stale screen, then the real thing
  ids[17] = await ready(17, { name: "Qadir RvChk" });
  const v17 = await versionOf(ids[17]);
  assert.equal((await approve(ids[17], await approval(ids[17]), OPS)).status, 403, "ops cannot approve");
  assert.equal((await approve(ids[17], await approval(ids[17]), tokenFor(1, "CUSTOMER"))).status, 403);

  // E8: the zone link fails after the partner row was inserted, so nothing is kept
  await sql(`ALTER TABLE delivery_partner_zones ADD CONSTRAINT rvchk_boom CHECK (zone_id <> ${Number(zone.id)}) NOT VALID`);
  const boom = await approve(ids[17], await approval(ids[17]));
  await sql("ALTER TABLE delivery_partner_zones DROP CONSTRAINT rvchk_boom");
  assert.equal(boom.status, 500);
  assert.equal((await partnersOf(17)).length, 0, "no partner row survived");
  assert.deepEqual([(await row(ids[17])).status, await versionOf(ids[17])], ["UNDER_REVIEW", v17]);
  assert.equal(await count(ids[17], "APPROVED"), 0);

  // A4: someone verified something on another screen a minute ago
  assert.equal((await tick(ids[17], "SAFETY_BRIEFING", { done: false })).status, 200);
  assert.equal((await tick(ids[17], "SAFETY_BRIEFING", { done: true })).status, 200);
  const staleApprove = await approve(ids[17], await approval(ids[17], { expected_version: v17 }));
  assert.deepEqual([staleApprove.status, staleApprove.body.errors], [409, { version: v17 + 2 }]);
  assert.equal((await partnersOf(17)).length, 0);

  const v17b = await versionOf(ids[17]);
  const done = await approve(ids[17], await approval(ids[17], { note: "ZZ-approve-note: strong references" }));
  assert.equal(done.status, 201);
  for (const hidden of ["file_key", "sha256", "number_hmac"]) assert.ok(!JSON.stringify(done.body).includes(hidden), `${hidden} must not be returned (G3)`);
  const approved = done.body.data;
  assert.deepEqual([approved.status, approved.version, approved.reviewer_id], ["APPROVED", v17b + 1, 991102]);
  assert.deepEqual(approved.can_decide, { request_changes: false, reject: false, approve: false });
  assert.deepEqual([approved.decision.decided_by, approved.decision.note, approved.decision.reason_code], [991102, "ZZ-approve-note: strong references", null]);
  assert.equal(approved.decision.decided_by, approved.reviewer_id, "the reviewer may approve their own review (E11)");

  const [partner] = await partnersOf(17);
  assert.deepEqual([approved.partner_id, approved.decision.partner_id], [partner.id, partner.id]);
  assert.deepEqual(
    [partner.name, partner.phone, partner.vehicle_type, normalizePlate(partner.vehicle_number), partner.zone_id, partner.max_active_orders, partner.status, partner.application_id],
    ["Qadir RvChk", "99900991017", "BIKE", "PB65RV1017", Number(zone.id), 4, "ACTIVE", ids[17]]
  );
  assert.ok(partner.joined_at);
  assert.deepEqual([partner.is_online, partner.current_active_orders], [false, 0]);
  assert.deepEqual(await sql("SELECT zone_id::text AS zone_id, is_primary FROM delivery_partner_zones WHERE delivery_partner_id = :p", { p: partner.id }), [{ zone_id: String(zone.id), is_primary: true }]);
  assert.deepEqual(await sql("SELECT status, remarks FROM delivery_status_history WHERE delivery_partner_id = :p", { p: partner.id }), [{ status: "ACTIVE", remarks: "Approved" }]);
  const [approvedEvent] = await eventsOf(ids[17], "APPROVED");
  assert.deepEqual([approvedEvent.visible_to_applicant, approvedEvent.payload, String(approvedEvent.actor_id)], [true, null, "991102"]);
  const cameBack = await heard(17);
  for (const secret of ["ZZ-approve-note", "991102"]) assert.ok(!cameBack.includes(secret), `the applicant never sees ${secret}`);
  assert.equal((await call("GET", "/me", applicant(17))).body.data.status, "APPROVED");

  // the Phase 2 exit: the new partner is in the staff partner list, in the chosen zone, with the phone masked
  const listed = await (await fetch(`http://localhost:${env.PORT}/delivery-partners/list?${new URLSearchParams({ search: "Qadir RvChk" })}`, { headers: { authorization: `Bearer ${ADMIN}` } })).json();
  const inList = listed.data.partners.find((p) => p.id === partner.id);
  assert.ok(inList, "the approved applicant shows in GET /delivery-partners/list");
  assert.deepEqual([inList.zone, inList.phone], [{ id: Number(zone.id), name: "RvChk Zone" }, "••••••••017"]);

  const approvedTwice = await approve(ids[17], await approval(ids[17]));
  assert.deepEqual([approvedTwice.status, approvedTwice.body.message], [409, DECIDED], "a double click (A6)");
  assert.equal((await partnersOf(17)).length, 1);

  // two admins press Approve together: one partner (A2)
  ids[18] = await ready(18, { name: "Rani RvChk" });
  const input18 = await approval(ids[18]);
  const pressed = await Promise.all([approve(ids[18], input18, ADMIN), approve(ids[18], input18, ADMIN2)]);
  assert.deepEqual(pressed.map((r) => r.status).sort(), [201, 409]);
  assert.equal(pressed.find((r) => r.status === 409).body.message, DECIDED, "the loser waits, then finds it decided");
  assert.equal((await partnersOf(18)).length, 1);
  assert.equal(await count(ids[18], "APPROVED"), 1);

  // two applications, one plate written two ways, approved together: one partner (A3, E4)
  ids[15] = await ready(15, { name: "Omkar RvChk" });
  ids[16] = await ready(16, { name: "Parth RvChk" });
  await sql("UPDATE delivery_partner_applications SET vehicle_number = 'pb65 rv-1015' WHERE id = :id", { id: ids[16] });
  const plates = await Promise.all([approve(ids[15], await approval(ids[15]), ADMIN), approve(ids[16], await approval(ids[16]), ADMIN2)]);
  assert.deepEqual(plates.map((r) => r.status).sort(), [201, 400]);
  const taken = plates.find((r) => r.status === 400);
  assert.deepEqual(taken.body.errors.map((g) => g.code), ["VEHICLE_TAKEN"]);
  assert.ok(!/RvChk|9990099101[56]/.test(JSON.stringify(taken.body)), "and it does not say whose vehicle it is");
  assert.equal((await sql("SELECT count(*)::int AS n FROM delivery_partners WHERE user_id IN (:a, :b)", { a: APPLICANTS[14], b: APPLICANTS[15] }))[0].n, 1);
  const outbid = plates[0].status === 400 ? ids[15] : ids[16];
  assert.deepEqual((await approve(outbid, await approval(outbid))).body.errors.map((g) => g.code), ["VEHICLE_TAKEN"], "and trying again is the same answer, not a 500");

  // D5: whoever created an application on someone's behalf cannot approve it; someone else can
  ids[19] = await ready(19, { name: "Rohan RvChk" });
  await sql("UPDATE delivery_partner_applications SET source = 'ADMIN', created_by = 991102 WHERE id = :id", { id: ids[19] });
  const own = await approve(ids[19], await approval(ids[19]));
  assert.equal(own.status, 403);
  assert.equal((await partnersOf(19)).length, 0);
  assert.equal((await row(ids[19])).status, "UNDER_REVIEW");
  assert.equal((await detailOf(ids[19])).can_decide.approve, false, "the screen knows too");
  assert.equal((await detailOf(ids[19], ADMIN2)).can_decide.approve, true);
  assert.equal((await approve(ids[19], await approval(ids[19]), ADMIN2)).status, 201);

  // a failed text never fails the request that asked for it (F4)
  await sms("not-a-number", "no-such-template", {});

  // A5: a decision and an upload at the same instant. Both wait on the application row, so exactly one wins; the loser is
  // refused, and a refused upload leaves no file on disk. (Which one goes first is up to Postgres, so both orders pass.)
  const folder = path.resolve(env.STORAGE_DIR, "applications", ids[9]);
  const filesBefore = fs.readdirSync(folder).length;
  const holder = await db.sequelize.transaction();
  await db.sequelize.query("SELECT 1 FROM delivery_partner_applications WHERE id = :id FOR UPDATE", { replacements: { id: ids[9] }, transaction: holder });
  const closing = reject(ids[9], { reason_code: "NO_RESPONSE", note: "No reply", expected_version: await versionOf(ids[9]) });
  await new Promise((resolve) => setTimeout(resolve, 400));
  const [{ type: sentBackType }] = await sql("SELECT type FROM delivery_partner_documents WHERE application_id = :id AND status = 'REJECTED'", { id: ids[9] });
  const uploading = upload(applicant(9), sentBackType, JPEG, "image/jpeg"); // the very file the applicant was asked for
  await new Promise((resolve) => setTimeout(resolve, 400));
  await holder.commit();
  const [closed, late] = await Promise.all([closing, uploading]);
  assert.notEqual(closed.status === 200, late.status === 200, `exactly one wins (reject ${closed.status}, upload ${late.status})`);
  assert.ok([closed.status, late.status].every((s) => [200, 404, 409].includes(s)), "and the loser is refused, never a 500");
  assert.equal(fs.readdirSync(folder).length, filesBefore, "no file left behind by either order");

  // ---- the rest of the review path is added step by step below this line ----

  console.log("partnerReview.check.js: ok");
} finally {
  await cleanup();
  await db.sequelize.close();
}
process.exit(0);
