import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ExternalLink, UserPlus } from "lucide-react";
import AssignStaffModal from "@/components/dashboard/AssignStaffModal";
import DemoBadge from "@/components/dashboard/DemoBadge";
import ReadOnlyNote from "@/components/dashboard/ReadOnlyNote";
import StatusPill from "@/components/dashboard/StatusPill";
import UnderlineTabs from "@/components/dashboard/UnderlineTabs";
import WarehouseLocationForm from "@/components/dashboard/WarehouseLocationForm";
import WarehouseOverview from "@/components/dashboard/WarehouseOverview";
import WarehouseSettingsForm from "@/components/dashboard/WarehouseSettingsForm";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import useWarehouse, { useWarehouseDetail, useWarehouseTeam } from "@/hooks/use-warehouse";
import useDeliveryZone from "@/hooks/use-deliveryZone";
import useStaff from "@/hooks/use-staff";
import { notify } from "@/lib/notify";
import { DEMO_NOTICE } from "@/lib/demoData";
import { formatLastLogin } from "@/lib/formatTime";
import { ROLE_BADGE_CLASSES, ROLE_DOT_CLASSES, fullName, initials } from "@/lib/staffRole";
import { WAREHOUSE_STATUS, warehouseStatus } from "@/lib/warehouseStatus";
import { SUPER_ADMIN_HINT, warehouseAccess } from "@/lib/warehouseAccess";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/formStyles";

const WarehouseDetailPage = () => {
  const { warehouseId } = useParams();
  const [tab, setTab] = useState("overview");
  const [assignMode, setAssignMode] = useState(null); // "staff" | "manager"
  const [removing, setRemoving] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const access = warehouseAccess(warehouseId);

  const { warehouse, isLoading } = useWarehouseDetail(warehouseId);
  const { updateMutation } = useWarehouse();
  const { assignMutation, removeMutation } = useWarehouseTeam(warehouseId);
  const { allStaff, isDemo: isDemoTeam } = useStaff(1, 100);
  const { deliveryZonesData } = useDeliveryZone(1, 100);
  const zones = deliveryZonesData?.data?.deliveryZones ?? [];

  // The team is whoever's staff account is at this warehouse.
  const members = useMemo(
    () => allStaff.filter((user) => String(user.warehouse_id) === String(warehouseId)),
    [allStaff, warehouseId]
  );

  if (!access.own) {
    return (
      <p className="text-sm text-muted-foreground">
        This isn't your store.{" "}
        {access.ownWarehouseId && (
          <Link to={`/admin/warehouses/${access.ownWarehouseId}`} className="font-semibold text-primary hover:text-primary/80">Go to your store</Link>
        )}
      </p>
    );
  }
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading warehouse…</p>;
  if (!warehouse) return <p className="text-sm text-muted-foreground">Warehouse not found.</p>;

  const status = warehouseStatus(warehouse);
  const zone = zones.find((item) => String(item.id) === String(warehouse.zone_id));
  const manager = members.find((user) => user.role === "ADMIN");

  const assign = (userIds, close) => {
    if (isDemoTeam) {
      notify.info(DEMO_NOTICE);
      close();
      return;
    }
    const replacing = assignMode === "manager" ? manager?.id : undefined;
    assignMutation.mutate({ userIds, replacing }, { onSuccess: close });
  };

  const remove = () => {
    if (isDemoTeam) notify.info(DEMO_NOTICE);
    else removeMutation.mutate(removing.id);
    setRemoving(null);
  };

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "location", label: "Location" },
    { value: "team", label: `Team · ${members.length}` },
    { value: "settings", label: "Settings" },
  ];

  return (
    <div className="space-y-5">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link to="/admin/warehouses" className="font-medium hover:text-foreground">Warehouses</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-foreground">{warehouse.name}</span>
      </nav>

      <header className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-[260px] flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-foreground">{warehouse.name}</h1>
            <StatusPill config={WAREHOUSE_STATUS[status]} />
          </div>
          <p className="text-sm text-muted-foreground">
            {[
              warehouse.code,
              [warehouse.address, warehouse.city].filter(Boolean).join(", "),
              zone?.name,
              manager ? `Manager ${fullName(manager)}` : "No manager yet",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {status === "DRAFT" ? (
          access.manages && (
            <Link to={`/admin/warehouses/new?draft=${warehouse.id}`} className={primaryButtonClass}>
              Continue setup
            </Link>
          )
        ) : (
          <a href="/store" target="_blank" rel="noreferrer" className={secondaryButtonClass}>
            Open store console
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
      </header>

      <UnderlineTabs
        label="Warehouse sections"
        tabs={tabs}
        value={tab}
        onChange={setTab}
      />

      {tab === "overview" && <WarehouseOverview warehouse={warehouse} zone={zone} members={members} manager={manager} />}

      {/* Each form keeps its own draft; switching tabs unmounts it, which drops unsaved edits. */}
      {tab === "location" && <WarehouseLocationForm warehouse={warehouse} access={access} zones={zones} />}

      {tab === "team" && (
        <section className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="flex flex-wrap items-center gap-2.5 px-5 py-4">
            <h2 className="flex flex-1 items-center gap-2 font-display text-base font-bold text-foreground">
              People at this warehouse {isDemoTeam && <DemoBadge title="Sample people until the staff API answers." />}
            </h2>
            {access.isSuperAdmin ? (
              <>
                <Link to="/admin/staff/new" className={secondaryButtonClass}>Add staff</Link>
                <button type="button" onClick={() => setAssignMode("staff")} className={primaryButtonClass}>
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  Assign staff
                </button>
              </>
            ) : (
              <ReadOnlyNote>{SUPER_ADMIN_HINT}</ReadOnlyNote>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {["Name", "Role here", "Phone", "Last login", ""].map((heading) => (
                    <th key={heading} className="px-5 py-3 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No one works here yet. Assign a store manager first.</td>
                  </tr>
                )}
                {members.map((user) => (
                  <tr key={user.id} className="border-t border-border">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-[13px] font-bold text-primary">{initials(user)}</span>
                        <span className="font-semibold text-foreground">{fullName(user)}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill config={{ badge: ROLE_BADGE_CLASSES[user.role], dot: ROLE_DOT_CLASSES[user.role] }}>
                        {user.role === "ADMIN" ? "Store manager" : "Ops staff"}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{user.phone || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatLastLogin(user.last_login_at)}</td>
                    <td className="px-5 py-3 text-right">
                      {!access.isSuperAdmin ? null : user.role === "ADMIN" ? (
                        <button type="button" onClick={() => setAssignMode("manager")} className="font-semibold text-primary hover:text-primary/80">Change manager</button>
                      ) : (
                        <button type="button" onClick={() => setRemoving(user)} className="font-semibold text-destructive hover:text-destructive/80">Remove</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "settings" && (
        <div className="space-y-4">
          <WarehouseSettingsForm warehouse={warehouse} access={access} />

          {access.isSuperAdmin && status === "DEACTIVATED" && (
            <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white p-5">
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="font-display text-base font-bold text-foreground">Reactivate warehouse</span>
                <span className="text-[13px] text-muted-foreground">Customers and riders see it again, with the status set above.</span>
              </span>
              <button type="button" onClick={() => updateMutation.mutate({ id: warehouseId, data: { is_active: true } })} disabled={updateMutation.isPending} className={primaryButtonClass}>
                Reactivate
              </button>
            </section>
          )}

          {access.isSuperAdmin && warehouse.is_active && (
            <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/30 bg-white p-5">
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="font-display text-base font-bold text-destructive">Deactivate warehouse</span>
                <span className="text-[13px] text-muted-foreground">Hides it from customers and riders. Orders and stock history stay.</span>
              </span>
              <button type="button" onClick={() => setConfirmDeactivate(true)} className={`${secondaryButtonClass} border-destructive/40 text-destructive hover:bg-destructive/5`}>
                Deactivate
              </button>
            </section>
          )}
        </div>
      )}

      <AssignStaffModal
        open={Boolean(assignMode)}
        onClose={() => setAssignMode(null)}
        warehouse={warehouse}
        staff={allStaff}
        managerOnly={assignMode === "manager"}
        isPending={assignMutation.isPending}
        onAssign={assign}
      />
      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        title={`Remove ${removing ? fullName(removing) : ""}?`}
        message="They can no longer sign in to this store's app and console until assigned to a warehouse again."
        confirmText="Remove"
      />
      <ConfirmDialog
        open={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={() => {
          updateMutation.mutate({ id: warehouseId, data: { is_active: false } });
          setConfirmDeactivate(false);
        }}
        title={`Deactivate ${warehouse.name}?`}
        message="Customers in this zone won't be able to order from it until you reactivate it. Its manager can't turn it back on."
        confirmText="Deactivate"
      />
    </div>
  );
};

export default WarehouseDetailPage;
