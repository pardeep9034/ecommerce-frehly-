import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Copy, Eye, EyeOff, Plus, RefreshCw, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import DemoBadge from "@/components/dashboard/DemoBadge";
import FormField from "@/components/dashboard/FormField";
import StaffTable from "@/components/dashboard/StaffTable";
import SummaryTile from "@/components/dashboard/SummaryTile";
import UnderlineTabs from "@/components/dashboard/UnderlineTabs";
import Pagination from "@/components/common/Pagination";
import useStaff from "@/hooks/use-staff";
import useWarehouse from "@/hooks/use-warehouse";
import { notify } from "@/lib/notify";
import { DEMO_NOTICE } from "@/lib/demoData";
import { generatePassword } from "@/lib/password";
import { STAFF_STATUS, fullName } from "@/lib/staffRole";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/formStyles";

const selectClass = "h-9 rounded-[10px] border border-border bg-white px-2.5 text-[13px] text-foreground";

const StaffPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [status, setStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [resetting, setResetting] = useState(null); // { user, password, show, mustChange }
  const [moving, setMoving] = useState(null); // { user, warehouseId }
  const [disabling, setDisabling] = useState(null);

  const filters = { role, search, warehouse_id: warehouseId, status };
  const {
    staff,
    pagination,
    summary,
    isDemo,
    isLoading,
    updateMutation,
    setStatusMutation,
    resetPasswordMutation,
    resendInviteMutation,
  } = useStaff(currentPage, 20, filters);
  const { warehouses } = useWarehouse(1, 100);

  const filterSetter = (setter) => (value) => {
    setter(value);
    setCurrentPage(1);
  };

  // Demo users aren't stored anywhere, so their actions only explain why.
  const guard = (action) => (...args) => (isDemo ? notify.info(DEMO_NOTICE) : action(...args));

  const tabs = [
    { value: "", label: `All · ${summary.total ?? 0}` },
    { value: "SUPER_ADMIN", label: `Super admins · ${summary.super_admin ?? 0}` },
    { value: "ADMIN", label: `Admins · ${summary.admin ?? 0}` },
    { value: "OPS_STAFF", label: `Ops staff · ${summary.ops_staff ?? 0}` },
  ];

  const toggleStatus = guard((user) =>
    user.is_active ? setDisabling(user) : setStatusMutation.mutate({ id: user.id, isActive: true })
  );

  const confirmReset = () => {
    const { user, password, mustChange } = resetting;
    resetPasswordMutation.mutate(
      { id: user.id, data: { password_method: "set", password, must_change_password: mustChange } },
      {
        onSuccess: () => {
          notify.success(`Password reset for ${fullName(user)}`);
          setResetting(null);
        },
      }
    );
  };

  const confirmMove = () => {
    updateMutation.mutate(
      { id: moving.user.id, data: { warehouse_id: Number(moving.warehouseId) } },
      { onSuccess: () => setMoving(null) }
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-muted-foreground">
          Everyone who can sign in to the admin dashboard or the store app and console.
        </p>
        <Link to="/dashboard/staff/new" className={primaryButtonClass}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add user
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="Super admins" value={summary.super_admin ?? 0} note="Log in anywhere" valueClassName="text-purple-700" />
        <SummaryTile
          label="Admins · store managers"
          value={summary.admin ?? 0}
          note={summary.admin_unassigned ? `${summary.admin_unassigned} not assigned` : "All assigned"}
          valueClassName="text-teal-700"
        />
        <SummaryTile label="Ops staff" value={summary.ops_staff ?? 0} note={`${summary.on_shift ?? 0} on shift now`} valueClassName="text-blue-700" />
        <SummaryTile
          label="Need attention"
          value={summary.attention ?? 0}
          note={`${summary.locked ?? 0} locked · ${summary.first_login_pending ?? 0} first login pending`}
          valueClassName={summary.attention ? "text-destructive" : "text-foreground"}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="px-4 pt-2">
          <UnderlineTabs label="Filter by role" tabs={tabs} value={role} onChange={filterSetter(setRole)} />
        </div>
        <div className="flex flex-wrap items-center gap-2 px-4 py-3.5">
          <label className="flex h-10 w-full items-center gap-2 rounded-[10px] border border-border px-3 text-muted-foreground sm:w-[300px]">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              aria-label="Search users"
              value={search}
              onChange={(event) => filterSetter(setSearch)(event.target.value)}
              placeholder="Search name, phone or email"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>
          <span className="flex-1" />
          {isDemo && <DemoBadge title="Sample users from the design until GET /auth/admin/users exists." />}
          <select aria-label="Filter by warehouse" value={warehouseId} onChange={(event) => filterSetter(setWarehouseId)(event.target.value)} className={selectClass}>
            <option value="">All warehouses</option>
            <option value="none">Not assigned</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={String(warehouse.id)}>{warehouse.name}</option>
            ))}
          </select>
          <select aria-label="Filter by status" value={status} onChange={(event) => filterSetter(setStatus)(event.target.value)} className={selectClass}>
            <option value="">All statuses</option>
            {Object.entries(STAFF_STATUS).map(([value, config]) => (
              <option key={value} value={value}>{config.label}</option>
            ))}
          </select>
        </div>

        <StaffTable
          staff={staff}
          isLoading={isLoading}
          onEdit={(user) => navigate(`/dashboard/staff/new?edit=${user.id}`)}
          onResetPassword={guard((user) => setResetting({ user, password: generatePassword(), show: true, mustChange: true }))}
          onResendInvite={guard((user) =>
            resendInviteMutation.mutate(user.id, { onSuccess: () => notify.success(`Login details sent to ${user.phone}`) })
          )}
          onMove={guard((user) => setMoving({ user, warehouseId: user.warehouse_id ? String(user.warehouse_id) : "" }))}
          onToggleStatus={toggleStatus}
        />
      </section>

      {!isDemo && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination?.totalPages ?? 0}
          totalItems={pagination?.totalItems ?? 0}
          onPageChange={setCurrentPage}
        />
      )}

      <Dialog open={Boolean(resetting)} onOpenChange={(open) => !open && setResetting(null)}>
        {resetting && (
          <DialogContent className="flex max-w-[440px] flex-col gap-4 rounded-2xl p-6">
            <div className="flex flex-col gap-1 pr-6">
              <DialogTitle className="font-display text-xl font-bold">Reset password</DialogTitle>
              <DialogDescription>
                {fullName(resetting.user)} signs in with {resetting.user.phone} and this temporary password.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-muted px-3.5 py-3">
              <span className="flex-1 font-mono text-lg font-bold tracking-wide text-foreground">
                {resetting.show ? resetting.password : "•".repeat(resetting.password.length)}
              </span>
              <button type="button" aria-label={resetting.show ? "Hide password" : "Show password"} onClick={() => setResetting({ ...resetting, show: !resetting.show })} className="rounded-lg p-1.5 text-muted-foreground hover:bg-border hover:text-foreground">
                {resetting.show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button type="button" aria-label="New password" onClick={() => setResetting({ ...resetting, password: generatePassword() })} className="rounded-lg p-1.5 text-muted-foreground hover:bg-border hover:text-foreground">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Copy password"
                onClick={() => navigator.clipboard.writeText(resetting.password).then(() => notify.success("Password copied"))}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-border hover:text-foreground"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <label className="flex items-center gap-2.5 text-sm text-foreground">
              <input type="checkbox" checked={resetting.mustChange} onChange={(event) => setResetting({ ...resetting, mustChange: event.target.checked })} className="h-5 w-5 accent-primary" />
              Must change password at next login
            </label>
            <p className="text-[13px] text-muted-foreground">Shown only now. Their current sessions are signed out.</p>
            <div className="flex justify-end gap-2.5">
              <button type="button" onClick={() => setResetting(null)} className={secondaryButtonClass}>Cancel</button>
              <button type="button" onClick={confirmReset} disabled={resetPasswordMutation.isPending} className={primaryButtonClass}>
                {resetPasswordMutation.isPending ? "Saving…" : "Reset password"}
              </button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={Boolean(moving)} onOpenChange={(open) => !open && setMoving(null)}>
        {moving && (
          <DialogContent className="flex max-w-[440px] flex-col gap-4 rounded-2xl p-6">
            <div className="flex flex-col gap-1 pr-6">
              <DialogTitle className="font-display text-xl font-bold">Move {fullName(moving.user)}</DialogTitle>
              <DialogDescription>Each person works at one warehouse at a time. They sign in to the new store next time.</DialogDescription>
            </div>
            <FormField id="move-warehouse" label="Warehouse">
              <select id="move-warehouse" value={moving.warehouseId} onChange={(event) => setMoving({ ...moving, warehouseId: event.target.value })} className={inputClass}>
                <option value="">Pick a warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={String(warehouse.id)}>{warehouse.name}</option>
                ))}
              </select>
            </FormField>
            <div className="flex justify-end gap-2.5">
              <button type="button" onClick={() => setMoving(null)} className={secondaryButtonClass}>Cancel</button>
              <button
                type="button"
                onClick={confirmMove}
                disabled={!moving.warehouseId || moving.warehouseId === String(moving.user.warehouse_id) || updateMutation.isPending}
                className={primaryButtonClass}
              >
                Move
              </button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(disabling)}
        onClose={() => setDisabling(null)}
        onConfirm={() => {
          setStatusMutation.mutate({ id: disabling.id, isActive: false });
          setDisabling(null);
        }}
        title={`Disable ${disabling ? fullName(disabling) : ""}?`}
        message="They are signed out everywhere and can't log in until you enable the account again."
        confirmText="Disable account"
      />
    </div>
  );
};

export default StaffPage;
