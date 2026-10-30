import AppError from "./AppError.js";
import { ROLES } from "../constants/roles.js";

// The one store a caller is limited to: a store manager (ADMIN) or store staff (OPS_STAFF) gets the store on their
// token; the super admin and service tokens get null (every store). Store accounts with no store get a 403.
export const ownStore = (user) => {
  if (user?.role !== ROLES.ADMIN && user?.role !== ROLES.OPS_STAFF) return null;
  const warehouseId = Number(user.warehouse_id);
  if (!Number.isInteger(warehouseId) || warehouseId <= 0) throw new AppError("No store is assigned to this account", 403);
  return warehouseId;
};

// Refuses a store account looking at another store's row.
export const assertOwnStore = (user, warehouseId) => {
  const own = ownStore(user);
  if (own !== null && Number(warehouseId) !== own) throw new AppError("You do not have access to this order", 403);
};
