import { getToken, getTokenClaims } from "@/lib/tokenStorage";

// Who may do what on the Warehouses pages. Mirrors inventory-service warehouse.access.js (agreed in Task 193); the
// services enforce it, this only decides what the pages show.
// - Super admin: every store, every control.
// - Store manager (ADMIN): their own store only. Status, hours, pack-by, name, code, address, pin and pincode, and
//   taking a draft live. Never the zone, the contact, the team, deactivating or deleting.
// - Store staff (OPS_STAFF): their own store, read only.

export const SUPER_ADMIN_HINT = "Only the super admin can change this";

// Store staff see the page but change nothing; their manager or the super admin does.
export const VIEW_ONLY_HINT = "View only · your store manager or the super admin can change this";

// The signed-in staff member. `ownWarehouseId` (a string) is the one store a manager or store staff is limited to.
export const currentStaff = () => {
  const claims = getTokenClaims(getToken()) ?? {};
  const isSuperAdmin = claims.role === "SUPER_ADMIN";
  const ownWarehouseId = isSuperAdmin || claims.warehouse_id == null ? null : String(claims.warehouse_id);
  return { role: claims.role ?? null, isSuperAdmin, ownWarehouseId };
};

// What the caller may do on one warehouse's page.
export const warehouseAccess = (warehouseId) => {
  const { role, isSuperAdmin, ownWarehouseId } = currentStaff();
  const own = isSuperAdmin || (ownWarehouseId !== null && ownWarehouseId === String(warehouseId));
  return {
    isSuperAdmin,
    ownWarehouseId,
    own,
    manages: isSuperAdmin || (own && role === "ADMIN"),
  };
};
