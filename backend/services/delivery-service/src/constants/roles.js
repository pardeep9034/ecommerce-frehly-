export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  OPS_STAFF: "OPS_STAFF",
  CUSTOMER: "CUSTOMER",
  DELIVERY_PARTNER: "DELIVERY_PARTNER",
};

// Dashboard staff. No hierarchy in code: requireRole is an exact match, so list every role that may pass.
export const STAFF_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OPS_STAFF];
