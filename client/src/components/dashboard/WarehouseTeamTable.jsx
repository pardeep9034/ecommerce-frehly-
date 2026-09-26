import { UserMinus } from "lucide-react";
import { ROLE_BADGE_CLASSES, roleLabel } from "@/lib/staffRole";

const WarehouseTeamTable = ({ team = [], onRemove }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Name</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Role</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Phone</th>
              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {team.map((member) => (
              <tr key={member.user_id} className="border-b border-border transition-colors last:border-0 hover:bg-muted">
                <td className="px-5 py-4 font-medium text-foreground sm:px-6">{member.name}</td>
                <td className="px-5 py-4 sm:px-6">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE_CLASSES[member.role] || "bg-muted text-muted-foreground"}`}>
                    {member.role === "ADMIN" ? "Manager" : roleLabel(member.role)}
                  </span>
                </td>
                <td className="px-5 py-4 text-foreground sm:px-6">{member.phone || "—"}</td>
                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onRemove?.(member)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {team.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No staff assigned to this warehouse yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WarehouseTeamTable;
