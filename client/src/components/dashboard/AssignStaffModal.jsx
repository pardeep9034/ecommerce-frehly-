import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import StaffCheckRow from "@/components/dashboard/StaffCheckRow";
import { assignmentMeta, fullName, isMovingFromAnotherWarehouse } from "@/lib/staffRole";
import { shortWarehouseName } from "@/lib/warehouseStatus";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/formStyles";

// Pick people for a warehouse. `managerOnly` turns it into a single choice of admins
// ("Change manager" on the Team tab).
const AssignStaffModal = ({ open, onClose, warehouse, staff = [], onAssign, isPending, managerOnly = false }) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  const close = () => {
    setSearch("");
    setSelected([]);
    onClose();
  };

  const term = search.trim().toLowerCase();
  const candidates = staff.filter(
    (user) =>
      user.is_active &&
      (managerOnly ? user.role === "ADMIN" : user.role !== "SUPER_ADMIN") &&
      String(user.warehouse_id) !== String(warehouse?.id) &&
      (!term || `${fullName(user)} ${user.phone || ""}`.toLowerCase().includes(term))
  );
  const movers = staff.filter((user) => selected.includes(user.id) && isMovingFromAnotherWarehouse(user, warehouse?.id));

  const toggle = (id) =>
    setSelected((current) => (managerOnly ? [id] : current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const name = shortWarehouseName(warehouse?.name);
  const cta = selected.length === 0
    ? managerOnly ? "Select a manager" : "Select people"
    : managerOnly ? "Make manager" : `Assign ${selected.length} ${selected.length === 1 ? "person" : "people"}`;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="flex max-h-[85vh] max-w-[480px] flex-col gap-4 rounded-2xl p-6">
        <div className="flex flex-col gap-1 pr-6">
          <DialogTitle className="font-display text-xl font-bold text-foreground">
            {managerOnly ? `Change manager of ${name}` : `Assign staff to ${name}`}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Each person works at one warehouse at a time.
          </DialogDescription>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            aria-label="Search people"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or phone"
            className={`${inputClass} pl-10`}
          />
        </div>

        <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1">
          {candidates.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No one matches.</p>}
          {candidates.map((user) => (
            <StaffCheckRow
              key={user.id}
              user={user}
              type={managerOnly ? "radio" : "checkbox"}
              name={managerOnly ? "new-manager" : undefined}
              checked={selected.includes(user.id)}
              onChange={() => toggle(user.id)}
              meta={assignmentMeta(user, warehouse?.id)}
            />
          ))}
        </div>

        {movers.length > 0 && (
          <div role="status" className="flex gap-2.5 rounded-xl bg-warning/10 px-3.5 py-3 text-[13px] leading-relaxed text-foreground">
            <AlertTriangle className="h-[18px] w-[18px] shrink-0 text-warning" aria-hidden="true" />
            <span>
              {movers.map(fullName).join(", ")} will leave{" "}
              {[...new Set(movers.map((user) => shortWarehouseName(user.warehouse_name)))].join(", ")} and move here.
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5 border-t border-border pt-4">
          <span className="flex-1 text-[13px] text-muted-foreground">
            Not in the list?{" "}
            <Link to="/dashboard/staff/new" className="font-semibold text-primary hover:text-primary/80">
              Create a new user
            </Link>
          </span>
          <button type="button" onClick={close} className={secondaryButtonClass}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected.length || isPending}
            onClick={() => onAssign(selected, close)}
            className={primaryButtonClass}
          >
            {isPending ? "Saving…" : cta}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignStaffModal;
