// Run: node warehouseAccess.check.js   (no database, no running service)
import assert from "node:assert/strict";
import { allowedUpdate, assertCanCreate, assertCanDelete, sameValue, ownStore, assertOwnStore, assertEveryStore, assertManagesStock } from "./src/modules/warehouse/warehouse.access.js";

// Values as Sequelize returns them: BIGINT and DECIMAL as strings.
const store = { id: "4", zone_id: "1", name: "Kharar", code: "KHR", latitude: "30.70464900", longitude: "76.71787300", contact_person: "A", contact_phone: "98", is_active: true, operational_status: "OPEN" };
const draft = { ...store, is_active: false, operational_status: "SETTING_UP" };
const deactivated = { ...store, is_active: false, operational_status: "OPEN" };

const superAdmin = { user: { user_id: 1, role: "SUPER_ADMIN" } };
const manager = { user: { user_id: 7, role: "ADMIN", warehouse_id: 4 } };
const otherManager = { user: { user_id: 8, role: "ADMIN", warehouse_id: 5 } };
const unassigned = { user: { user_id: 9, role: "ADMIN", warehouse_id: null } };
const ops = { user: { user_id: 10, role: "OPS_STAFF", warehouse_id: 4 } };
const service = { user: null, service: true };

const refused = (fn, pattern) => assert.throws(fn, (error) => error.statusCode === 403 && pattern.test(error.message));

assert.ok(sameValue("30.70464900", 30.704649) && sameValue("1", 1) && sameValue(null, "") && !sameValue("1", 2));

// super admin: anything
assert.deepEqual(allowedUpdate(superAdmin, store, { zone_id: 2, is_active: false }), { zone_id: 2, is_active: false });

// manager, own store: day-to-day fields go through
const day = { operational_status: "PAUSED", pause_reason: "Rush", paused_until: null, store_open_time: "06:00", pack_by_minutes: 12, pincode: "160055", latitude: 30.71 };
assert.deepEqual(allowedUpdate(manager, store, day), day);
assert.deepEqual(allowedUpdate(manager, { ...store, operational_status: "MAINTENANCE" }, { operational_status: "OPEN" }), { operational_status: "OPEN" }, "reopens whoever closed it");
// the whole Location form: unchanged zone and contact (number vs string) are dropped, not refused
assert.deepEqual(allowedUpdate(manager, store, { zone_id: 1, contact_person: "A", latitude: "30.70464900", name: "Kharar 2" }), { latitude: "30.70464900", name: "Kharar 2" });
refused(() => allowedUpdate(manager, store, { zone_id: 2 }), /zone/);
refused(() => allowedUpdate(manager, store, { contact_phone: "99" }), /contact_phone/);
refused(() => allowedUpdate(manager, store, { is_active: false }), /deactivate/);
refused(() => allowedUpdate(manager, store, { operational_status: "SETTING_UP" }), /SETTING_UP/);

// going live: only from a draft
assert.deepEqual(allowedUpdate(manager, draft, { is_active: true, name: "Kharar" }), { is_active: true, name: "Kharar" });
assert.deepEqual(allowedUpdate(manager, draft, { is_active: "false" }), {}, "saving a draft as a draft changes nothing");
refused(() => allowedUpdate(manager, deactivated, { is_active: true }), /reactivate/);

// nobody else
refused(() => allowedUpdate(otherManager, store, { pack_by_minutes: 5 }), /own store/);
refused(() => allowedUpdate(unassigned, store, { pack_by_minutes: 5 }), /own store/);
refused(() => allowedUpdate(ops, store, { operational_status: "PAUSED" }), /own store/);

// services: the contact copy only
assert.deepEqual(allowedUpdate(service, store, { contact_person: null, contact_phone: null }), { contact_person: null, contact_phone: null });
refused(() => allowedUpdate(service, store, { operational_status: "PAUSED" }), /contact/);

// create and delete
assertCanCreate(superAdmin);
refused(() => assertCanCreate(manager), /super admin/);
assertCanDelete(superAdmin, draft);
refused(() => assertCanDelete(manager, draft), /super admin/);
assert.throws(() => assertCanDelete(superAdmin, store), (error) => error.statusCode === 409);
assert.throws(() => assertCanDelete(superAdmin, deactivated), (error) => error.statusCode === 409);

// reads: store accounts see their own store; the super admin and services every store (a request: { user, service })
assert.equal(ownStore(superAdmin), null);
assert.equal(ownStore(service), null);
assert.equal(ownStore({ user: manager.user, service: true }), null, "the internal key wins over a forwarded token");
assert.equal(ownStore(manager), 4);
assert.equal(ownStore(ops), 4);
refused(() => ownStore(unassigned), /No store/);
assertOwnStore(manager, "4");
assertOwnStore(superAdmin, 5);
refused(() => assertOwnStore(otherManager, 4), /own store/);
assertEveryStore(service);
refused(() => assertEveryStore(ops), /across stores/);

// stock writes (add an item, movements, low-stock level): super admin and services any store, a manager their own,
// store staff never
assertManagesStock(superAdmin, 5);
assertManagesStock(service, 5);
assertManagesStock(manager, "4");
refused(() => assertManagesStock(otherManager, 4), /own store/);
refused(() => assertManagesStock(unassigned, 4), /own store/);
refused(() => assertManagesStock(ops, 4), /Store staff/);

console.log("warehouseAccess.check.js: ok");
