import StatusPill from "@/components/dashboard/StatusPill";
import { ROLE_BADGE_CLASSES, ROLE_DOT_CLASSES, fullName, initials } from "@/lib/staffRole";

const SHORT_ROLE = { ADMIN: "Admin", OPS_STAFF: "Ops staff", SUPER_ADMIN: "Super admin" };

// A tickable person row (Add warehouse "Team" step, Assign staff dialog).
// `type="radio"` + `name` turns it into a single-choice row.
const StaffCheckRow = ({ user, checked, onChange, meta, type = "checkbox", name, showRole = true }) => (
  <label
    className={`flex min-h-[60px] cursor-pointer items-center gap-3 rounded-xl border-[1.5px] px-3.5 py-2 transition-colors ${
      checked ? "border-primary bg-secondary" : "border-border bg-white hover:bg-muted/60"
    }`}
  >
    <input
      type={type}
      name={name}
      checked={checked}
      onChange={onChange}
      className="m-0 h-5 w-5 shrink-0 accent-primary"
    />
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-bold text-primary">
      {initials(user)}
    </span>
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="truncate text-sm font-semibold text-foreground">{fullName(user)}</span>
      <span className="truncate text-xs text-muted-foreground">{meta}</span>
    </span>
    {showRole && (
      <StatusPill config={{ badge: ROLE_BADGE_CLASSES[user.role], dot: ROLE_DOT_CLASSES[user.role] }}>
        {SHORT_ROLE[user.role] || user.role}
      </StatusPill>
    )}
  </label>
);

export default StaffCheckRow;
