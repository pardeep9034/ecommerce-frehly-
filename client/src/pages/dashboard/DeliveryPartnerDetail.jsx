import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getProfile } from "@/apis/authApi";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import OnboardingTimeline from "@/components/dashboard/OnboardingTimeline";
import PageHeader from "@/components/dashboard/PageHeader";
import { Avatar, Card, DemoNote, StatusPill } from "@/components/partner/PartnerBits";
import { usePartnerOnboarding } from "@/hooks/use-delivery";
import { notify } from "@/lib/notify";
import { ACTIVE_ASSIGNMENTS, STATS_7D } from "@/lib/partnerDemoData";
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

const BACK = "/dashboard/delivery-partners?tab=partners";

const DeliveryPartnerDetail = () => {
  const { partnerId } = useParams();
  const { onboarding, isLoading, error } = usePartnerOnboarding(partnerId);
  const { data: profile } = useQuery({ queryKey: ["auth-profile"], queryFn: getProfile });
  const [suspendOpen, setSuspendOpen] = useState(false);

  if (isLoading) return <Notice backTo={BACK}>Loading partner…</Notice>;
  if (error || !onboarding) {
    return <Notice backTo={BACK}>{error?.response?.status === 404 ? "This partner does not exist." : "Could not load this partner. Try again in a moment."}</Notice>;
  }

  const { partner, application, documents, events } = onboarding;
  const suspended = partner.status === "SUSPENDED";
  const name = partner.name || "Unnamed partner";
  const byType = Object.fromEntries(documents.map((d) => [d.type, d]));

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
        <Stat label="Delivered · 7 days" value={STATS_7D.delivered} hint="Sample data" />
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
                <h2 className="font-display text-base font-semibold text-foreground">Zone</h2>
                <button type="button" onClick={() => notify.notWired("Managing partner zones")} className="text-sm font-semibold text-primary hover:underline">
                  Manage
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
                <Link to={`/dashboard/delivery-partners/applications/${application.id}`} className="text-sm font-semibold text-primary hover:underline">
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
      <DemoNote>Delivery stats and active assignments are sample data until partner orders exist. Profile, zone, documents and the onboarding record are live.</DemoNote>

      <ConfirmationModal
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        onSuccess={() => {
          setSuspendOpen(false);
          notify.notWired(suspended ? "Reactivating from this page" : "Suspending from this page");
        }}
        title={`${suspended ? "Reactivate" : "Suspend"} ${name}?`}
        cancelBtnName="Cancel"
        proceedBtnName={suspended ? "Reactivate" : "Suspend"}
      />
    </div>
  );
};

export default DeliveryPartnerDetail;
