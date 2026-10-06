import { useState } from "react";
import { useParams } from "react-router-dom";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import PageHeader from "@/components/dashboard/PageHeader";
import { Avatar, Card, DemoNote, StatusPill, Timeline } from "@/components/partner/PartnerBits";
import { notify } from "@/lib/notify";
import { ACTIVE_ASSIGNMENTS, ME, ONBOARDING_LOG, PARTNERS, PARTNER_DOCS, STATS_7D } from "@/lib/partnerDemoData";

const Stat = ({ label, value, hint }) => (
  <div className="rounded-xl border border-border bg-white p-4 shadow-card">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-1 font-display text-2xl font-semibold text-foreground">{value}</p>
    <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
  </div>
);

const DeliveryPartnerDetail = () => {
  const { partnerId } = useParams();
  const partner = PARTNERS.find((p) => p.id === partnerId) || PARTNERS[0];
  const [suspendOpen, setSuspendOpen] = useState(false);
  const suspended = partner.status === "Suspended";

  return (
    <div className="space-y-5">
      <PageHeader title={partner.name} backTo="/dashboard/delivery-partners?tab=partners" backLabel="Partners" />

      <Card className="flex flex-wrap items-center gap-4">
        <Avatar initials={partner.initials} className="h-14 w-14 text-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-foreground">{partner.name}</h2>
            <StatusPill status={partner.status} />
            <StatusPill status={partner.online ? "Online" : "Offline"} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {ME.phone} · {partner.vehicle} {ME.vehicleNumber} · location updated 20 s ago
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => notify.notWired("Editing partner details")} className="h-9 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted">
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

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Stat label="Delivered · 7 days" value={STATS_7D.delivered} hint={`${partner.deliveredToday} today`} />
        <Stat label="On-time rate" value={STATS_7D.onTime} hint="Last 7 days" />
        <Stat label="Failed attempts" value={STATS_7D.failed} hint="Last 7 days" />
        <Stat label="Handovers" value="2 / 1" hint="Given / received" />
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
                    {["Order", "Status", "Customer", "Due"].map((h) => <th key={h} className="py-2 pr-4 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {ACTIVE_ASSIGNMENTS.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 font-semibold text-foreground">#{a.id}</td>
                      <td className="py-3 pr-4"><StatusPill status={a.status} /></td>
                      <td className="py-3 pr-4 text-muted-foreground">{a.customer}</td>
                      <td className="py-3 text-muted-foreground">{a.due}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-5 sm:grid-cols-2">
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-foreground">Zones</h2>
                <button type="button" onClick={() => notify.notWired("Managing partner zones")} className="text-sm font-semibold text-primary hover:underline">
                  Manage
                </button>
              </div>
              <ul className="space-y-1.5 text-sm text-foreground">
                {ME.zones.map((z) => <li key={z}>{z}</li>)}
              </ul>
            </Card>
            <Card>
              <h2 className="mb-3 font-display text-base font-semibold text-foreground">Capacity</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Max active orders</dt><dd className="font-semibold">{partner.max}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Active right now</dt><dd className="font-semibold">{partner.active}</dd></div>
              </dl>
            </Card>
          </div>
        </div>

        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 font-display text-base font-semibold text-foreground">Documents</h2>
            <ul className="space-y-2.5 text-sm">
              {PARTNER_DOCS.map((d) => (
                <li key={d.label} className="flex items-center justify-between gap-2">
                  <span className="text-foreground">{d.label}</span>
                  <StatusPill status={d.status} />
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="mb-3 font-display text-base font-semibold text-foreground">Onboarding record</h2>
            <Timeline items={ONBOARDING_LOG} />
          </Card>
        </div>
      </div>
      <DemoNote>Partner profile, stats, documents and onboarding record are demo data — the partner detail API doesn't return them yet.</DemoNote>

      <ConfirmationModal
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        onSuccess={() => {
          setSuspendOpen(false);
          notify.notWired(suspended ? "Reactivating from this page" : "Suspending from this page");
        }}
        title={`${suspended ? "Reactivate" : "Suspend"} ${partner.name}?`}
        cancelBtnName="Cancel"
        proceedBtnName={suspended ? "Reactivate" : "Suspend"}
      />
    </div>
  );
};

export default DeliveryPartnerDetail;
