// Labels and helpers for the admin Activity log page (pages/dashboard/ActivityLog.jsx).

export const ACTIVITY_ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

// Time windows the servers accept (hours). Same list as RANGE_HOURS / ACTIVITY_HOURS on the backend.
export const RANGES = [
  [1, "Last hour"],
  [24, "Last 24 hours"],
  [168, "Last 7 days"],
  [720, "Last 30 days"],
];

// Filter chips: [value sent as `group`, label]. "" means all.
export const SECURITY_GROUPS = [["", "All"], ["inout", "Sign-in and out"], ["failed", "Failed"], ["password", "Password"], ["lock", "Block and unblock"]];
export const ONBOARDING_GROUPS = [["", "All"], ["flow", "Flow"], ["docs", "Documents"], ["checks", "Checks"], ["decisions", "Decisions"]];

// Auth-service audit events. `dot` is the colour of the marker beside the label.
export const SECURITY_EVENT = {
  LOGIN_SUCCESS: { label: "Signed in", dot: "bg-success" },
  LOGOUT: { label: "Signed out", dot: "bg-muted-foreground" },
  LOGOUT_ALL: { label: "Signed out everywhere", dot: "bg-muted-foreground" },
  LOGIN_FAILURE: { label: "Sign-in failed", dot: "bg-destructive" },
  PASSWORD_CHANGE: { label: "Password changed", dot: "bg-info" },
  PASSWORD_RESET_REQUEST: { label: "Password reset asked", dot: "bg-info" },
  PASSWORD_RESET_SUCCESS: { label: "Password reset done", dot: "bg-info" },
  ACCOUNT_LOCKED: { label: "Account blocked", dot: "bg-warning" },
  ACCOUNT_UNLOCKED: { label: "Account unblocked", dot: "bg-warning" },
};
export const securityEvent = (type) => SECURITY_EVENT[type] ?? { label: type, dot: "bg-muted-foreground" };

// Marker colour of an onboarding event: approvals and rejections stand out, the rest go by stage.
const ONBOARDING_DOT = {
  APPROVED: "bg-success",
  REJECTED: "bg-destructive",
  CHANGES_REQUESTED: "bg-warning",
  CREATED: "bg-info", SUBMITTED: "bg-info", RESUBMITTED: "bg-info",
  DOC_UPLOADED: "bg-violet", DOC_VIEWED: "bg-violet", DOC_VERIFIED: "bg-violet", DOC_REJECTED: "bg-violet",
  CHECK_DONE: "bg-teal", CHECK_UNDONE: "bg-teal",
};
export const onboardingDot = (type) => ONBOARDING_DOT[type] ?? "bg-muted-foreground";

// Who is behind an onboarding event. No names in tokens yet, so staff show as their id and role.
const ROLE_LABEL = { ADMIN: "Admin", SUPER_ADMIN: "Super admin", OPS_STAFF: "Ops" };
export const actorName = (e) =>
  e.actor_role === "DELIVERY_PARTNER" ? "Applicant" : e.actor_id === null ? "System" : `Staff #${e.actor_id} · ${ROLE_LABEL[e.actor_role] ?? e.actor_role}`;

// "Chrome · Windows" from a user-agent string; "—" when there is none.
export const shortAgent = (ua) => {
  if (!ua) return "—";
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : null;
  const system = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : null;
  return [browser, system].filter(Boolean).join(" · ") || "Other";
};

// The server stores UTC; staff read the Indian clock. A log wants seconds, so these two differ from whenIST.
const IST = { timeZone: "Asia/Kolkata" };
export const timeIST = (iso) => new Date(iso).toLocaleTimeString("en-IN", { ...IST, hour12: false });
export const dayIST = (iso) => new Date(iso).toLocaleDateString("en-IN", { ...IST, day: "numeric", month: "short" });
export const fullIST = (iso) => (iso ? `${dayIST(iso)} ${new Date(iso).getFullYear()}, ${timeIST(iso)}` : "—");

export const prettyJson = (value) => (value && Object.keys(value).length ? JSON.stringify(value, null, 2) : "");
