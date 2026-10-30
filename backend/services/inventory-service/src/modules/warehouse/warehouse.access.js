import AppError from "../../utils/AppError.js";

// Who may change a warehouse (agreed 2026-10-27, Task 193):
// - SUPER_ADMIN: everything.
// - A store manager (ADMIN whose token warehouse_id is this store): run it day to day. Pause, maintenance, reopen;
//   hours and pack-by; name, code, address, pin and pincode; take a SETTING_UP draft live. Never the zone, the
//   contact fields, deactivating, or reactivating a deactivated store.
// - A sibling service (x-internal-key): only the contact fields, which auth-service copies from the store's manager.
// - Anyone else (OPS_STAFF, another store's manager): nothing.
// The client sends whole forms, so a field a manager may not change is dropped when it is unchanged and refused
// only when it would change.

const MANAGER_FIELDS = new Set([
  "name", "code", "address", "city", "state", "country", "latitude", "longitude", "pincode",
  "store_open_time", "store_close_time", "pack_by_minutes",
  "operational_status", "pause_reason", "paused_until", "maintenance_message", "is_active",
]);
const SERVICE_FIELDS = new Set(["contact_person", "contact_phone"]);
const MANAGER_STATUSES = new Set(["OPEN", "PAUSED", "MAINTENANCE"]);
// What counts as the store's location for the "manager moved the store" alert.
export const LOCATION_FIELDS = ["address", "city", "state", "country", "latitude", "longitude", "pincode"];

const forbidden = (message) => new AppError(message, 403);

// Sequelize hands DECIMAL and BIGINT back as strings ("30.70464900", "1"); the client may send numbers.
export const sameValue = (a, b) => {
  const blank = (value) => value === null || value === undefined || value === "";
  if (blank(a) || blank(b)) return blank(a) && blank(b);
  if (String(a) === String(b)) return true;
  return Number.isFinite(Number(a)) && Number.isFinite(Number(b)) && Number(a) === Number(b);
};

export const isSuperAdmin = (user) => user?.role === "SUPER_ADMIN";
export const managesWarehouse = (user, warehouse) =>
  user?.role === "ADMIN" && user.warehouse_id != null && String(user.warehouse_id) === String(warehouse.id);

const toBoolean = (value) => value === true || value === "true";

// The fields of `data` this caller may write, or a 403. `caller` is { user, service }.
export function allowedUpdate({ user, service }, warehouse, data) {
  if (service) {
    const extra = Object.keys(data).find((key) => !SERVICE_FIELDS.has(key));
    if (extra) throw forbidden(`A service can only update the warehouse contact, not ${extra}`);
    return data;
  }
  if (isSuperAdmin(user)) return data;
  if (!managesWarehouse(user, warehouse)) throw forbidden("You can only change your own store");

  const allowed = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "is_active") {
      const active = toBoolean(value);
      if (active === warehouse.is_active) continue;
      if (!active) throw forbidden("Only the super admin can deactivate a store");
      if (warehouse.operational_status !== "SETTING_UP") throw forbidden("Only the super admin can reactivate a deactivated store");
      allowed.is_active = true;
    } else if (key === "operational_status") {
      if (value === warehouse.operational_status) continue;
      if (!MANAGER_STATUSES.has(value)) throw forbidden(`Only the super admin can set the status to ${value}`);
      allowed.operational_status = value;
    } else if (MANAGER_FIELDS.has(key)) {
      allowed[key] = value;
    } else if (!sameValue(value, warehouse[key])) {
      throw forbidden(key === "zone_id" ? "Only the super admin can move a store to another zone" : `Only the super admin can change ${key}`);
    }
  }
  return allowed;
}

export function assertCanCreate({ user }) {
  if (!isSuperAdmin(user)) throw forbidden("Only the super admin can add a warehouse");
}

// Who may read a store's stock, movements and reservations: a store manager (ADMIN) or store staff (OPS_STAFF) sees
// only the store on their token; the super admin and a sibling service see every store.
// The store a request is limited to, or null for every store. A store account with no store gets a 403.
export function ownStore(req) {
  const { user } = req;
  if (req.service || (user?.role !== "ADMIN" && user?.role !== "OPS_STAFF")) return null;
  const warehouseId = Number(user.warehouse_id);
  if (!Number.isInteger(warehouseId) || warehouseId <= 0) throw forbidden("No store is assigned to this account");
  return warehouseId;
}

export function assertOwnStore(req, warehouseId) {
  const own = ownStore(req);
  if (own !== null && Number(warehouseId) !== own) throw forbidden("You can only see your own store");
}

// Who may change a store's stock: add an item, record a movement, change the low-stock level (agreed 2026-10-29,
// Task 200). The super admin and a sibling service: any store. A store manager (ADMIN): their own store.
// Store staff (OPS_STAFF) only view.
export function assertManagesStock(req, warehouseId) {
  const { user } = req;
  if (req.service || isSuperAdmin(user)) return;
  if (user?.role !== "ADMIN") throw forbidden("Store staff can view stock but not change it; ask your store manager");
  if (user.warehouse_id == null || String(user.warehouse_id) !== String(warehouseId)) {
    throw forbidden("You can only change your own store's stock");
  }
}

// Lists that span every store (all inventory, by variant, by order): the super admin and services only.
export function assertEveryStore(req) {
  if (ownStore(req) !== null) throw forbidden("Only the super admin can list across stores");
}

export function assertCanDelete({ user }, warehouse) {
  if (!isSuperAdmin(user)) throw forbidden("Only the super admin can delete a warehouse");
  if (warehouse.is_active || warehouse.operational_status !== "SETTING_UP") {
    throw new AppError("Only a draft (still setting up) can be deleted; deactivate this store instead", 409);
  }
}
