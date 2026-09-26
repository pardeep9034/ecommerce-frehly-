export const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "OPS_STAFF"];

export const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  OPS_STAFF: "Ops Staff",
};

export const ROLE_DESCRIPTIONS = {
  SUPER_ADMIN: "Full access to every store, staff account and setting.",
  ADMIN: "Manages a warehouse: inventory, orders and its assigned staff.",
  OPS_STAFF: "Handles day-to-day picking, packing and order fulfilment.",
};

export const ROLE_BADGE_CLASSES = {
  SUPER_ADMIN: "bg-purple-50 text-purple-700",
  ADMIN: "bg-blue-50 text-blue-700",
  OPS_STAFF: "bg-teal-50 text-teal-700",
};

export const roleLabel = (role) => ROLE_LABELS[role] || role;
