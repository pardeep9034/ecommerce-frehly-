import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ExternalLink, Info, Printer, UserPlus } from "lucide-react";
import AssignStaffModal from "@/components/dashboard/AssignStaffModal";
import DemoBadge from "@/components/dashboard/DemoBadge";
import FormField from "@/components/dashboard/FormField";
import StatusPill from "@/components/dashboard/StatusPill";
import SummaryTile from "@/components/dashboard/SummaryTile";
import UnderlineTabs from "@/components/dashboard/UnderlineTabs";
import WarehouseLocationFields from "@/components/dashboard/WarehouseLocationFields";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import { Switch } from "@/components/ui/switch";
import useWarehouse, { useWarehouseDetail, useWarehouseSettings, useWarehouseTeam } from "@/hooks/use-warehouse";
import useDeliveryZone from "@/hooks/use-deliveryZone";
import useStaff from "@/hooks/use-staff";
import { notify } from "@/lib/notify";
import { DEMO_LABEL_PRINTER, DEMO_NOTICE, DEMO_WAREHOUSE_METRICS } from "@/lib/demoData";
import { formatLastLogin } from "@/lib/formatTime";
import { ROLE_BADGE_CLASSES, ROLE_DOT_CLASSES, fullName, initials } from "@/lib/staffRole";
import { WAREHOUSE_STATUS, warehouseStatus, zoneLabel } from "@/lib/warehouseStatus";
import {
  formFromWarehouse,
  settingsPayload,
  validateLocation,
  validateOperations,
  warehousePayload,
} from "@/lib/warehouseForm";
import { cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/formStyles";

const STORE_STATUS_OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "PAUSED", label: "Pause orders" },
  { value: "MAINTENANCE", label: "Maintenance" },
];

const PAUSE_OPTIONS = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "60", label: "1 hour" },
  { value: "MANUAL", label: "Until I turn it back on" },
];

const reopensAt = (minutes) =>
  new Date(Date.now() + Number(minutes) * 60000).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

const settingsFromWarehouse = (warehouse) => ({
  ...formFromWarehouse(warehouse),
  operational_status: warehouseStatus(warehouse) === "DRAFT" ? "OPEN" : warehouseStatus(warehouse),
  pause_minutes: "30",
  pause_reason: warehouse?.pause_reason ?? "",
  maintenance_message: warehouse?.maintenance_message ?? "",
});

const WarehouseDetailPage = () => {
  const { warehouseId } = useParams();
  const [tab, setTab] = useState("overview");
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [assignMode, setAssignMode] = useState(null); // "staff" | "manager"
  const [removing, setRemoving] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const { warehouse, isLoading } = useWarehouseDetail(warehouseId);
  const { updateMutation } = useWarehouse();
  const { updateSettingsMutation } = useWarehouseSettings(warehouseId);
  const { team, isDemo: teamIsDemo, assignMutation, removeMutation } = useWarehouseTeam(warehouseId);
  const { allStaff, isDemo: staffIsDemo } = useStaff(1, 100);
  const { deliveryZonesData } = useDeliveryZone(1, 100);
  const zones = deliveryZonesData?.data?.deliveryZones ?? [];

  useEffect(() => {
    if (warehouse) setForm(settingsFromWarehouse(warehouse));
  }, [warehouse]);

  // Until GET /warehouses/:id/team exists, the team is whoever the staff list places here.
  const members = useMemo(() => {
    if (teamIsDemo) return allStaff.filter((user) => String(user.warehouse_id) === String(warehouseId));
    const byId = new Map(allStaff.map((user) => [user.id, user]));
    return team.map((member) => ({ ...member, ...byId.get(member.user_id), id: member.user_id }));
  }, [teamIsDemo, team, allStaff, warehouseId]);
  const isDemoTeam = teamIsDemo || staffIsDemo;

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading warehouse…</p>;
  if (!warehouse || !form) return <p className="text-sm text-muted-foreground">Warehouse not found.</p>;

  const status = warehouseStatus(warehouse);
  const zone = zones.find((item) => String(item.id) === String(warehouse.zone_id));
  const manager = members.find((user) => user.role === "ADMIN");
  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, store_hours: undefined }));
  };
  const resetForm = () => {
    setForm(settingsFromWarehouse(warehouse));
    setErrors({});
  };

  const saveLocation = async () => {
    const found = validateLocation(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    await updateMutation.mutateAsync({ id: warehouseId, data: warehousePayload(form) }).catch(() => null);
    // Pincode has no column yet; it rides along with the settings endpoint.
    if (form.pincode !== (warehouse.pincode ?? "")) updateSettingsMutation.mutate({ pincode: form.pincode });
  };

  const saveSettings = () => {
    const found = validateOperations(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    const rest = settingsPayload(form);
    updateSettingsMutation.mutate({
      ...rest,
      operational_status: form.operational_status,
      ...(form.operational_status === "PAUSED" && {
        pause_reason: form.pause_reason.trim() || undefined,
        paused_until:
          form.pause_minutes === "MANUAL" ? null : new Date(Date.now() + Number(form.pause_minutes) * 60000).toISOString(),
      }),
      ...(form.operational_status === "MAINTENANCE" && { maintenance_message: form.maintenance_message.trim() }),
    });
  };

  const assign = (userIds, close) => {
    if (isDemoTeam) {
      notify.info(DEMO_NOTICE);
      close();
      return;
    }
    assignMutation.mutate(userIds, { onSuccess: close });
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

  const m = DEMO_WAREHOUSE_METRICS;

  return (
    <div className="space-y-5">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link to="/dashboard/warehouses" className="font-medium hover:text-foreground">Warehouses</Link>
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
          <Link to={`/dashboard/warehouses/new?draft=${warehouse.id}`} className={primaryButtonClass}>
            Continue setup
          </Link>
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
        onChange={(next) => {
          resetForm();
          setTab(next);
        }}
      />

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-bold text-foreground">Today</h2>
            <DemoBadge />
          </div>
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <SummaryTile label="Orders today" value={m.ordersToday} note={m.slotNote} />
            <SummaryTile label="Avg pick + pack" value={m.avgPickPack} note={m.pickPackTarget} />
            <SummaryTile label="Late to pack" value={m.lateToPack} valueClassName="text-destructive" note="Past the pack-by time" />
            <SummaryTile label="Riders online" value={m.ridersOnline} note={zone ? `In ${zoneLabel(zone)}` : "In this zone"} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
            <section className={cardClass}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-base font-bold text-foreground">Orders in the store now</h2>
                <span className="text-[13px] text-muted-foreground">{m.openOrders} open</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                {m.pipeline.map((stage) => (
                  <div key={stage.label} className="flex flex-col items-center gap-1 rounded-xl bg-muted px-2 py-3 text-center">
                    <span className="font-display text-2xl font-bold text-foreground">{stage.count}</span>
                    <span className="text-xs text-muted-foreground">{stage.label}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className={cardClass}>
              <h2 className="font-display text-base font-bold text-foreground">Needs attention</h2>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {m.attention.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-foreground">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}

      {tab === "location" && (
        <section className={cardClass}>
          <WarehouseLocationFields form={form} errors={errors} onChange={setField} zones={zones} idPrefix="detail" />
          <div className="flex gap-2.5 rounded-xl bg-blue-50 px-3.5 py-3 text-[13px] text-foreground">
            <Info className="h-[18px] w-[18px] shrink-0 text-blue-700" aria-hidden="true" />
            Moving the pin or changing the zone changes which customers can order from this store.
          </div>
          <div className="flex justify-end gap-2.5">
            <button type="button" onClick={resetForm} className={secondaryButtonClass}>Cancel</button>
            <button type="button" onClick={saveLocation} disabled={updateMutation.isPending} className={primaryButtonClass}>
              {updateMutation.isPending ? "Saving…" : "Save location"}
            </button>
          </div>
        </section>
      )}

      {tab === "team" && (
        <section className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="flex flex-wrap items-center gap-2.5 px-5 py-4">
            <h2 className="flex flex-1 items-center gap-2 font-display text-base font-bold text-foreground">
              People at this warehouse {isDemoTeam && <DemoBadge title="Sample people until the staff and team APIs exist." />}
            </h2>
            <Link to="/dashboard/staff/new" className={secondaryButtonClass}>Create user</Link>
            <button type="button" onClick={() => setAssignMode("staff")} className={primaryButtonClass}>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Assign staff
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {["Name", "Role here", "Phone", "Now", "Last login", ""].map((heading) => (
                    <th key={heading} className="px-5 py-3 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">No one works here yet. Assign a store manager first.</td>
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
                    <td className="px-5 py-3">
                      {user.on_shift ? <span className="font-semibold text-success">On shift</span> : <span className="text-muted-foreground">Off shift</span>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{formatLastLogin(user.last_login_at)}</td>
                    <td className="px-5 py-3 text-right">
                      {user.role === "ADMIN" ? (
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
          <section className={cardClass}>
            <h2 className="font-display text-base font-bold text-foreground">Store status</h2>
            <div role="radiogroup" aria-label="Store status" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
              {STORE_STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={form.operational_status === option.value}
                  onClick={() => setField("operational_status", option.value)}
                  className={`h-10 rounded-lg text-sm transition-colors ${
                    form.operational_status === option.value ? "bg-white font-bold text-foreground shadow-sm" : "font-medium text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {form.operational_status === "PAUSED" && (
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-foreground">Pause for</span>
                  <div className="flex flex-wrap gap-2">
                    {PAUSE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={form.pause_minutes === option.value}
                        onClick={() => setField("pause_minutes", option.value)}
                        className={`h-10 rounded-xl border-[1.5px] px-4 text-sm font-semibold ${
                          form.pause_minutes === option.value ? "border-primary bg-secondary text-primary" : "border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <FormField id="pause-reason" label="Reason (customers see this)">
                  <input id="pause-reason" value={form.pause_reason} onChange={(event) => setField("pause_reason", event.target.value)} placeholder="Too many orders right now" className={inputClass} />
                </FormField>
                <p className="text-[13px] text-muted-foreground">
                  {form.pause_minutes === "MANUAL" ? "Stays paused until you switch it back to Open." : `Reopens at ${reopensAt(form.pause_minutes)}.`}
                </p>
              </div>
            )}
            {form.operational_status === "MAINTENANCE" && (
              <FormField id="maint-message" label="Message for customers">
                <input id="maint-message" value={form.maintenance_message} onChange={(event) => setField("maintenance_message", event.target.value)} placeholder="Closed for maintenance, back tomorrow at 6 AM" className={inputClass} />
              </FormField>
            )}
          </section>

          <section className={cardClass}>
            <h2 className="font-display text-base font-bold text-foreground">Operations</h2>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr]">
              <FormField id="set-open" label="Store hours" error={errors.store_hours} className="sm:col-span-2 xl:col-span-1">
                <div className="flex items-center gap-2">
                  <input id="set-open" aria-label="Opens at" type="time" value={form.store_open_time} onChange={(event) => setField("store_open_time", event.target.value)} className={`${inputClass} min-w-0 px-2.5`} />
                  <span aria-hidden="true">–</span>
                  <input aria-label="Closes at" type="time" value={form.store_close_time} onChange={(event) => setField("store_close_time", event.target.value)} className={`${inputClass} min-w-0 px-2.5`} />
                </div>
              </FormField>
              <FormField id="set-packby" label="Pack-by target (min)" error={errors.pack_by_minutes}>
                <input id="set-packby" type="number" min={1} value={form.pack_by_minutes} onChange={(event) => setField("pack_by_minutes", event.target.value)} className={inputClass} />
              </FormField>
              <FormField id="set-max" label="Max orders per slot" error={errors.max_orders_per_slot}>
                <input id="set-max" type="number" min={1} value={form.max_orders_per_slot} onChange={(event) => setField("max_orders_per_slot", event.target.value)} className={inputClass} />
              </FormField>
            </div>
            <div className="flex min-h-14 items-center gap-3 border-t border-border pt-3">
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">Auto-assign riders</span>
                <span className="text-xs text-muted-foreground">Offer packed orders to the nearest rider in the zone</span>
              </span>
              <Switch aria-label="Auto-assign riders" checked={form.auto_assign_riders} onCheckedChange={(checked) => setField("auto_assign_riders", checked)} />
            </div>
            <div className="flex min-h-14 items-center gap-3 border-t border-border pt-3">
              <Printer className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">Label printer <DemoBadge /></span>
                <span className="text-xs text-muted-foreground">{DEMO_LABEL_PRINTER}</span>
              </span>
              <button type="button" onClick={() => notify.info(DEMO_NOTICE)} className={secondaryButtonClass}>Test print</button>
            </div>
          </section>

          <div className="flex justify-end gap-2.5">
            <button type="button" onClick={resetForm} className={secondaryButtonClass}>Cancel</button>
            <button type="button" onClick={saveSettings} disabled={updateSettingsMutation.isPending} className={primaryButtonClass}>
              {updateSettingsMutation.isPending ? "Saving…" : "Save settings"}
            </button>
          </div>

          {warehouse.is_active && (
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
        message="Customers in this zone won't be able to order from it until you finish setup again."
        confirmText="Deactivate"
      />
    </div>
  );
};

export default WarehouseDetailPage;
