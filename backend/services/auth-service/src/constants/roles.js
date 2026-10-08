// Roles allowed to use the admin-only endpoints (spread into requireRole(...)).
export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

// The only roles a public sign-up may ask for. Staff roles are never self-service.
export const SIGNUP_ROLES = ["CUSTOMER", "DELIVERY_PARTNER"];
export const DEFAULT_SIGNUP_ROLE = "CUSTOMER";
