import { MoreVertical, Edit2, KeyRound, Send, Ban, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_BADGE_CLASSES, roleLabel } from "@/lib/staffRole";

const initials = (user) =>
  [user.first_name, user.last_name]
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

const StatusBadge = ({ user }) => {
  if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
    return <span className="inline-flex rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">Locked</span>;
  }
  if (!user.is_active) {
    return <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Disabled</span>;
  }
  return <span className="inline-flex rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">Active</span>;
};

const StaffTable = ({
  staff = [],
  onEdit,
  onResetPassword,
  onResendInvite,
  onToggleStatus,
}) => {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">User</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Role</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Warehouse</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Status</th>
              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Actions</th>
            </tr>
          </thead>

          <tbody>
            {staff.map((user) => (
              <tr key={user.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted">
                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initials(user)}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">
                        {[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.phone || user.email}</p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4 sm:px-6">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE_CLASSES[user.role] || "bg-muted text-muted-foreground"}`}>
                    {roleLabel(user.role)}
                  </span>
                </td>

                <td className="px-5 py-4 text-foreground sm:px-6">{user.warehouse_name || "—"}</td>

                <td className="px-5 py-4 sm:px-6">
                  <StatusBadge user={user} />
                </td>

                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit?.(user)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onResetPassword?.(user)}>
                          <KeyRound className="mr-2 h-4 w-4" /> Reset password
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onResendInvite?.(user)}>
                          <Send className="mr-2 h-4 w-4" /> Resend login details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleStatus?.(user)}>
                          {user.is_active ? (
                            <>
                              <Ban className="mr-2 h-4 w-4" /> Disable account
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" /> Enable account
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}

            {staff.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffTable;
