import { useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import useStaff from "@/hooks/use-staff";
import { Button } from "@/components/ui/button";
import { roleLabel } from "@/lib/staffRole";

const AssignStaffModal = ({ open, onClose, team = [], onAssign }) => {
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);

  const { staff, isLoading } = useStaff(1, 100);

  const assignedIds = useMemo(() => new Set(team.map((member) => member.user_id)), [team]);

  const assignableStaff = staff.filter((user) => {
    if (user.role === "SUPER_ADMIN" || assignedIds.has(user.id)) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [user.first_name, user.last_name].filter(Boolean).join(" ").toLowerCase().includes(term);
  });

  if (!open) return null;

  const handleAssign = () => {
    if (!selectedUserId) return;
    onAssign?.(selectedUserId);
    setSelectedUserId(null);
    setSearch("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-md rounded-xl border border-border bg-white shadow-card max-h-[85vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="font-display text-lg font-semibold text-foreground">Assign staff</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <p className="text-xs text-muted-foreground">
            Admins assigned here show as this warehouse's manager; ops staff show as team members.
          </p>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search admins & ops staff..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-1.5">
            {isLoading && <p className="px-3 py-4 text-sm text-muted-foreground">Loading staff...</p>}
            {!isLoading && assignableStaff.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground">No available staff to assign.</p>
            )}
            {assignableStaff.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selectedUserId === user.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                }`}
              >
                <span>{[user.first_name, user.last_name].filter(Boolean).join(" ")}</span>
                <span className="text-xs text-muted-foreground">{roleLabel(user.role)}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" disabled={!selectedUserId} onClick={handleAssign}>
              Assign
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignStaffModal;
