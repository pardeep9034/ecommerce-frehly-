// Roles allowed to use the admin-only endpoints (spread into requireRole(...)).
export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

// Accounts managed on the admin Staff pages (everyone who signs in to the dashboard or the store app).
export const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "OPS_STAFF"];

// The only roles a public sign-up may ask for. Staff roles are never self-service.
export const SIGNUP_ROLES = ["CUSTOMER", "DELIVERY_PARTNER"];
export const DEFAULT_SIGNUP_ROLE = "CUSTOMER";
