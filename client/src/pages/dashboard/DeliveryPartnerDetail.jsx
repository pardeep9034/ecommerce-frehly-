import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getProfile } from "@/apis/authApi";
import OnboardingTimeline from "@/components/dashboard/OnboardingTimeline";
import PageHeader from "@/components/dashboard/PageHeader";
import { Avatar, Card, StatusPill } from "@/components/partner/PartnerBits";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePartnerOnboarding, usePartnerWork, useUpdatePartner } from "@/hooks/use-delivery";
import useDeliveryZone from "@/hooks/use-deliveryZone";
import { STEP_LABEL } from "@/lib/assignmentStatus";
import { notify } from "@/lib/notify";
import { DOC_LABEL, DOC_ORDER, DOC_STATUS, PARTNER_STATUS, SOURCE_LABEL, VEHICLE_LABEL, whenIST } from "@/lib/partnerReview";

const Stat = ({ label, value, hint }) => (
  <div className="rounded-xl border border-border bg-white p-4 shadow-card">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-1 font-display text-2xl font-semibold text-foreground">{value}</p>
    <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
  </div>
);

const initialsOf = (name) => (name || "?").split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

const Notice = ({ backTo, children }) => (
  <div className="space-y-5">
    <PageHeader title="Delivery partner" backTo={backTo} backLabel="Partners" />
    <p className="text-sm text-muted-foreground">{children}</p>
  </div>
);

const BACK = "/admin/delivery-partners?tab=partners";

const INPUT = "mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary";
const GHOST = "h-9 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";
const SOLID = "h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground";
const DANGER = "h-9 rounded-lg bg-destructive px-4 text-sm font-semibold text-white hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50";

const Field = ({ label, error, children }) => (
  <label className="block text-sm font-medium text-foreground">
    {label}
    {children}
    {error && <span className="mt-1 block text-xs font-normal text-destructive">{error}</span>}
  </label>
);

// Mounted only while open, so every open starts from the partner as saved. Same rules as Add partner.
const EditPartnerDialog = ({ partner, update, onClose }) => {
  const [form, setForm] = useState({
    name: partner.name ?? "",
    vehicle_type: partner.vehicle_type ?? "BIKE",
    vehicle_number: partner.vehicle_number ?? "",
    max_active_orders: String(partner.max_active_orders ?? 1),
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const cycle = form.vehicle_type === "CYCLE";
  const max = Number(form.max_active_orders);
  const errors = {
    name: form.name.trim().length < 2 ? "Enter the partner's name" : "",
    vehicle_number: !cycle && form.vehicle_number.trim().length < 4 ? "Enter the vehicle number" : "",
    max_active_orders: Number.isInteger(max) && max >= 1 ? "" : "Enter a whole number, 1 or more",
  };
  const invalid = Object.values(errors).some(Boolean);

  const save = (event) => {
    event.preventDefault();
    if (invalid) return;
    const next = {
      name: form.name.trim(),
      vehicle_type: form.vehicle_type,
      // The route refuses an empty number, so a cycle keeps whatever number is saved.
      vehicle_number: cycle ? undefined : form.vehicle_number.trim(),
      max_active_orders: max,
    };
    const changed = Object.fromEntries(Object.entries(next).filter(([key, value]) => value !== undefined && value !== partner[key]));
    if (!Object.keys(changed).length) return onClose();
    update.mutate(changed, {
      onSuccess: () => {
        notify.success("Partner details saved");
        onClose();
      },
      onError: (error) => notify.apiError(error, "Could not save the changes"),
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={save} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit details</DialogTitle>
            <DialogDescription>The phone number is the partner's login, so it can't be changed here.</DialogDescription>
          </DialogHeader>
          <Field label="Full name" error={errors.name}>
            <input value={form.name} onChange={set("name")} maxLength={150} className={INPUT} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vehicle type">
              <select value={form.vehicle_type} onChange={set("vehicle_type")} className={INPUT}>
                {Object.entries(VEHICLE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            {!cycle && (
              <Field label="Vehicle number" error={errors.vehicle_number}>
                <input value={form.vehicle_number} onChange={set("vehicle_number")} maxLength={20} placeholder="PB 70 C 1203" autoComplete="off" className={INPUT} />
              </Field>
            )}
          </div>
          <Field label="Max active orders" error={errors.max_active_orders}>
            <input type="number" inputMode="numeric" min={1} step={1} value={form.max_active_orders} onChange={set("max_active_orders")} className={INPUT} />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">How many open jobs this partner can hold at once.</span>
          </Field>
          <DialogFooter className="gap-2">
            <button type="button" onClick={onClose} className={GHOST}>Cancel</button>
            <button type="submit" disabled={invalid || update.isPending} className={SOLID}>{update.isPending ? "Saving…" : "Save"}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// A partner works one zone: it decides which orders they are offered and who they can hand over to.
const ZoneDialog = ({ partner, openJobs, update, onClose }) => {
  const { deliveryZonesData, isLoading } = useDeliveryZone(1, 100);
  const zones = (deliveryZonesData?.data?.deliveryZones ?? []).filter((z) => z.is_active !== false);
  const current = partner.zone?.id ? String(partner.zone.id) : "";
  const [zone, setZone] = useState(current);

  const save = (event) => {
    event.preventDefault();
    if (!zone || zone === current) return onClose();
    const name = zones.find((z) => String(z.id) === zone)?.name;
    update.mutate(
      { zone_id: Number(zone) },
      {
        onSuccess: () => {
          notify.success(`Zone changed to ${name}`);
          onClose();
        },
        onError: (error) => notify.apiError(error, "Could not change the zone"),
      }
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={save} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Change zone</DialogTitle>
            <DialogDescription>
              The partner is offered orders from this zone only.
              {openJobs > 0 && ` Their ${openJobs} open ${openJobs === 1 ? "job stays" : "jobs stay"} with them.`}
            </DialogDescription>
          </DialogHeader>
          <Field label="Zone">
            <select value={zone} onChange={(e) => setZone(e.target.value)} disabled={isLoading} className={INPUT}>
              {!current && <option value="">Choose a zone</option>}
              {zones.map((z) => <option key={z.id} value={String(z.id)}>{z.name}</option>)}
            </select>
          </Field>
          <DialogFooter className="gap-2">
            <button type="button" onClick={onClose} className={GHOST}>Cancel</button>
            <button type="submit" disabled={!zone || zone === current || update.isPending} className={SOLID}>{update.isPending ? "Saving…" : "Save"}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const DeliveryPartnerDetail = () => {
  const { partnerId } = useParams();
  const { onboarding, isLoading, error } = usePartnerOnboarding(partnerId);
  const { work, error: workError } = usePartnerWork(partnerId);
  const { stats, active } = work ?? {};
  const { data: profile } = useQuery({ queryKey: ["auth-profile"], queryFn: getProfile });
  const { update, setSuspended } = useUpdatePartner(partnerId);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [zoneOpen, setZoneOpen] = useState(false);

  if (isLoading) return <Notice backTo={BACK}>Loading partner…</Notice>;
  if (error || !onboarding) {
    return <Notice backTo={BACK}>{error?.response?.status === 404 ? "This partner does not exist." : "Could not load this partner. Try again in a moment."}</Notice>;
  }

  const { partner, application, documents, events } = onboarding;
  const suspended = partner.status === "SUSPENDED";
  const name = partner.name || "Unnamed partner";
  const byType = Object.fromEntries(documents.map((d) => [d.type, d]));

  // A suspended partner is refused by the partner app and by every assign, so open jobs stay with them until reactivated.
  const openJobs = active?.length ?? 0;
  const statusNote = suspended
    ? "They can use the partner app and get new orders again."
    : openJobs > 0
      ? `They can't use the partner app or get new orders. They still hold ${openJobs} open ${openJobs === 1 ? "job" : "jobs"}, which can't move until you reactivate them.`
      : "They can't use the partner app or get new orders until you reactivate them.";

  const toggleStatus = () =>
    setSuspended.mutate(!suspended, {
      onSuccess: () => {
        notify.success(suspended ? `${name} is active again` : `${name} is suspended`);
        setSuspendOpen(false);
      },
      onError: (error) => notify.apiError(error, suspended ? "Could not reactivate this partner" : "Could not suspend this partner"),
    });

  return (
    <div className="space-y-5">
      <PageHeader title={name} backTo={BACK} backLabel="Partners" />

      <Card className="flex flex-wrap items-center gap-4">
        <Avatar initials={initialsOf(partner.name)} className="h-14 w-14 text-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-foreground">{name}</h2>
            <StatusPill status={PARTNER_STATUS[partner.status] ?? partner.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {[partner.phone, [VEHICLE_LABEL[partner.vehicle_type] ?? partner.vehicle_type, partner.vehicle_number].filter(Boolean).join(" "), partner.joined_at && `joined ${whenIST(partner.joined_at)}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditOpen(true)} className="h-9 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted">
            Edit details
          </button>
          <button
            type="button"
            onClick={() => setSuspendOpen(true)}
            className="h-9 rounded-lg border border-destructive/30 px-4 text-sm font-semibold text-destructive hover:bg-destructive/5"
          >
            {suspended ? "Reactivate" : "Suspend"}
          </button>
        </div>
      </Card>

      {/* No on-time rate: nothing records the promised delivery time yet. */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Stat label="Delivered" value={stats?.delivered_7d ?? "–"} hint="Last 7 days" />
        <Stat label="Failed attempts" value={stats?.failed_7d ?? "–"} hint="Last 7 days" />
        <Stat label="Handovers" value={stats ? `${stats.handovers_given_7d} / ${stats.handovers_received_7d}` : "–"} hint="Given / received · 7 days" />
        <Stat label="Open jobs" value={active ? `${active.length} / ${partner.max_active_orders ?? "–"}` : "–"} hint="Now / max" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-foreground">Active assignments</h2>
              <button type="button" onClick={() => notify.notWired("Reassigning orders from here")} className="text-sm font-semibold text-primary hover:underline">
                Reassign
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    {["Order", "Status", "Customer", "Assigned"].map((h) => <th key={h} className="py-2 pr-4 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {active?.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 font-semibold text-foreground">#{a.order_id}</td>
                      <td className="py-3 pr-4"><StatusPill status={STEP_LABEL[a.status] ?? a.status} /></td>
                      <td className="py-3 pr-4 text-muted-foreground">{a.customer_name}</td>
                      <td className="py-3 text-muted-foreground">{whenIST(a.assigned_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {workError && <p className="text-sm text-destructive">Couldn’t load this partner’s jobs. Reload to try again.</p>}
            {active?.length === 0 && <p className="text-sm text-muted-foreground">No open jobs right now.</p>}
          </Card>

          <div className="grid gap-5 sm:grid-cols-2">
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-foreground">Zone</h2>
                <button type="button" onClick={() => setZoneOpen(true)} className="text-sm font-semibold text-primary hover:underline">
                  Change
                </button>
              </div>
              <p className="text-sm text-foreground">{partner.zone?.name ?? "No zone assigned"}</p>
            </Card>
            <Card>
              <h2 className="mb-3 font-display text-base font-semibold text-foreground">Capacity</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Max active orders</dt><dd className="font-semibold">{partner.max_active_orders ?? "—"}</dd></div>
              </dl>
            </Card>
          </div>
        </div>

        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 font-display text-base font-semibold text-foreground">Documents</h2>
            {!application ? (
              <p className="text-sm text-muted-foreground">No documents on file. This partner was added directly, without an application.</p>
            ) : (
              <ul className="space-y-2.5 text-sm">
                {DOC_ORDER.filter((type) => byType[type]).map((type) => {
                  const d = byType[type];
                  return (
                    <li key={type} className="flex items-center justify-between gap-2">
                      <span className="text-foreground">
                        {DOC_LABEL[type]}
                        {d.number_masked && <span className="block text-xs text-muted-foreground">{d.number_masked}</span>}
                      </span>
                      <StatusPill status={DOC_STATUS[d.status]} />
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-foreground">Onboarding record</h2>
              {application && (
                <Link to={`/admin/delivery-partners/applications/${application.id}`} className="text-sm font-semibold text-primary hover:underline">
                  View application
                </Link>
              )}
            </div>
            {application ? (
              <>
                <p className="mb-3 text-xs text-muted-foreground">{application.ref} · {SOURCE_LABEL[application.source]}</p>
                <OnboardingTimeline events={events} me={Number(profile?.id)} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No onboarding record. This partner was added directly.</p>
            )}
          </Card>
        </div>
      </div>

      {editOpen && <EditPartnerDialog partner={partner} update={update} onClose={() => setEditOpen(false)} />}
      {zoneOpen && <ZoneDialog partner={partner} openJobs={openJobs} update={update} onClose={() => setZoneOpen(false)} />}

      <Dialog open={suspendOpen} onOpenChange={(open) => !open && setSuspendOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{suspended ? "Reactivate" : "Suspend"} {name}?</DialogTitle>
            <DialogDescription>{statusNote}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button type="button" onClick={() => setSuspendOpen(false)} className={GHOST}>Cancel</button>
            <button type="button" disabled={setSuspended.isPending} onClick={toggleStatus} className={suspended ? SOLID : DANGER}>
              {suspended ? "Reactivate" : "Suspend"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveryPartnerDetail;
