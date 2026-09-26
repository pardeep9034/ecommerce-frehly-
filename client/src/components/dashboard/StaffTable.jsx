import { ArrowRightLeft, Ban, CheckCircle, Edit2, KeyRound, MoreHorizontal, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StatusPill from "@/components/dashboard/StatusPill";
import { formatLastLogin } from "@/lib/formatTime";
import { ROLE_BADGE_CLASSES, ROLE_DOT_CLASSES, STAFF_STATUS, fullName, initials, staffStatus } from "@/lib/staffRole";

const SHORT_ROLE = { SUPER_ADMIN: "Super admin", ADMIN: "Admin", OPS_STAFF: "Ops staff" };

const warehouseCell = (user) => {
  if (user.role === "SUPER_ADMIN") return <span className="text-muted-foreground">All warehouses</span>;
  if (!user.warehouse_id) return <span className="font-semibold text-destructive">Not assigned</span>;
  return <span className="text-foreground">{user.warehouse_name || `Warehouse #${user.warehouse_id}`}</span>;
};

const StaffTable = ({ staff = [], isLoading, onEdit, onResetPassword, onResendInvite, onMove, onToggleStatus }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[860px] text-sm">
      <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
        <tr>
          <th className="px-5 py-3 font-semibold">User</th>
          <th className="px-5 py-3 font-semibold">Role</th>
          <th className="px-5 py-3 font-semibold">Warehouse</th>
          <th className="px-5 py-3 font-semibold">Status</th>
          <th className="px-5 py-3 font-semibold">Last login</th>
          <th className="w-14 px-5 py-3"><span className="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        {isLoading && (
          <tr>
            <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Loading users…</td>
          </tr>
        )}
        {!isLoading && staff.length === 0 && (
          <tr>
            <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">No users match these filters.</td>
          </tr>
        )}
        {!isLoading &&
          staff.map((user) => {
            const status = staffStatus(user);
            return (
              <tr key={user.id} className="border-t border-border transition-colors hover:bg-muted/50">
                <td className="px-5 py-3">
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-bold text-primary">
                      {initials(user)}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="font-semibold text-foreground">{fullName(user)}</span>
                      <span className="text-xs text-muted-foreground">{user.phone || user.email}</span>
                    </span>
                  </span>
                </td>
                <td className="px-5 py-3">
                  <StatusPill config={{ badge: ROLE_BADGE_CLASSES[user.role], dot: ROLE_DOT_CLASSES[user.role] }}>
                    {SHORT_ROLE[user.role] || user.role}
                  </StatusPill>
                </td>
                <td className="px-5 py-3">{warehouseCell(user)}</td>
                <td className="px-5 py-3">
                  <StatusPill config={STAFF_STATUS[status]} />
                </td>
                <td className="px-5 py-3">
                  {status === "LOCKED" ? (
                    <span className="text-destructive">{user.failed_login_attempts || "Too many"} failed logins</span>
                  ) : (
                    <span className="text-muted-foreground">{formatLastLogin(user.last_login_at)}</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={`Actions for ${fullName(user)}`}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => onEdit(user)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Edit details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onResetPassword(user)}>
                        <KeyRound className="mr-2 h-4 w-4" /> Reset password
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onResendInvite(user)}>
                        <Send className="mr-2 h-4 w-4" /> Resend login details
                      </DropdownMenuItem>
                      {user.role !== "SUPER_ADMIN" && (
                        <DropdownMenuItem onClick={() => onMove(user)}>
                          <ArrowRightLeft className="mr-2 h-4 w-4" /> Move to another warehouse
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onToggleStatus(user)}
                        className={user.is_active ? "text-destructive focus:text-destructive" : ""}
                      >
                        {user.is_active ? <Ban className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        {user.is_active ? "Disable account" : "Enable account"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>
  </div>
);

export default StaffTable;
