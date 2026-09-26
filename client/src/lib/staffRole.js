export const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "OPS_STAFF"];

export const ROLE_LABELS = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin · store manager",
  OPS_STAFF: "Ops staff",
};

export const ROLE_DESCRIPTIONS = {
  SUPER_ADMIN:
    "Logs in anywhere: admin dashboard plus every warehouse’s store console and app. Creates all users.",
  ADMIN: "Runs one warehouse: store console and app, store settings, riders and its ops staff.",
  OPS_STAFF: "Works in one warehouse: store app and console to pick, pack, hand over and update stock.",
};

export const ROLE_ACCESS = {
  SUPER_ADMIN: ["Admin dashboard", "Every warehouse (store picker in console)", "Creates admins and ops staff"],
  ADMIN: ["Store console + store app", "One warehouse", "Store settings, riders, its ops staff"],
  OPS_STAFF: ["Store app + console", "One warehouse", "No store settings"],
};

// Purple / teal / blue are a deliberate category system (see .claude/.CLAUDE.md), not brand colors.
export const ROLE_BADGE_CLASSES = {
  SUPER_ADMIN: "bg-purple-50 text-purple-700",
  ADMIN: "bg-teal-50 text-teal-700",
  OPS_STAFF: "bg-blue-50 text-blue-700",
};

export const ROLE_DOT_CLASSES = {
  SUPER_ADMIN: "bg-purple-700",
  ADMIN: "bg-teal-700",
  OPS_STAFF: "bg-blue-700",
};

export const roleLabel = (role) => ROLE_LABELS[role] || role;

const SHORT_ROLE_LABELS = { SUPER_ADMIN: "Super admin", ADMIN: "Admin", OPS_STAFF: "Ops staff" };

// "Ops staff · not assigned" / "Admin · at Zirakpur, will move here" (assign pickers)
export const assignmentMeta = (user, targetWarehouseId) => {
  const role = SHORT_ROLE_LABELS[user.role] || user.role;
  if (!user.warehouse_id) return `${role} · not assigned`;
  if (String(user.warehouse_id) === String(targetWarehouseId)) return `${role} · already here`;
  const where = (user.warehouse_name || "another warehouse").split("·").pop().trim();
  return `${role} · at ${where}, will move here`;
};

export const isMovingFromAnotherWarehouse = (user, targetWarehouseId) =>
  Boolean(user.warehouse_id) && String(user.warehouse_id) !== String(targetWarehouseId);

export const fullName = (user) => [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "—";

export const initials = (user) =>
  [user?.first_name, user?.last_name]
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

// Account states the Staff list shows, most urgent first.
export const STAFF_STATUS = {
  DISABLED: { label: "Disabled", badge: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  LOCKED: { label: "Locked", badge: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  INVITE_SENT: { label: "Invite sent", badge: "bg-blue-50 text-blue-700", dot: "bg-blue-700" },
  MUST_CHANGE_PASSWORD: { label: "Must change password", badge: "bg-warning/15 text-warning", dot: "bg-warning" },
  ACTIVE: { label: "Active", badge: "bg-success/10 text-success", dot: "bg-success" },
};

export const staffStatus = (user) => {
  if (!user.is_active) return "DISABLED";
  if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) return "LOCKED";
  if (user.invite_pending) return "INVITE_SENT";
  if (user.must_change_password) return "MUST_CHANGE_PASSWORD";
  return "ACTIVE";
};

export const needsAttention = (user) => ["LOCKED", "INVITE_SENT", "MUST_CHANGE_PASSWORD"].includes(staffStatus(user));
