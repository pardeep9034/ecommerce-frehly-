import WebShell from "@/components/partner/WebShell";
import { Avatar, Card, DemoNote, StatusPill } from "@/components/partner/PartnerBits";
import { notify } from "@/lib/notify";
import { ME, PARTNER_DOCS, STATS_7D } from "@/lib/partnerDemoData";

const Row = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="font-semibold text-foreground">{value}</dd>
  </div>
);

const Profile = () => (
  <WebShell title="Profile" subtitle="Your account, vehicle and documents">
    <Card className="flex flex-wrap items-center gap-4">
      <Avatar initials={ME.initials} className="h-16 w-16 text-xl" />
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl font-semibold text-foreground">{ME.name}</h2>
          <StatusPill status="Active" />
          <StatusPill status="Online" />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{ME.phone} · {ME.email}</p>
        <p className="text-xs text-muted-foreground">Partner since {ME.since} · approved by Freshly Ops</p>
      </div>
    </Card>

    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="space-y-3">
        <h2 className="font-display text-base font-semibold text-foreground">Last 7 days</h2>
        <dl className="space-y-2">
          <Row label="Delivered" value={STATS_7D.delivered} />
          <Row label="Failed attempts" value={STATS_7D.failed} />
          <Row label="Handovers" value={STATS_7D.handovers} />
          <Row label="On-time rate" value={STATS_7D.onTime} />
        </dl>
      </Card>
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-foreground">Vehicle</h2>
          <button type="button" onClick={() => notify.notWired("Vehicle change requests")} className="text-sm font-semibold text-primary">Request change</button>
        </div>
        <dl className="space-y-2">
          <Row label="Type" value={ME.vehicleLabel} />
          <Row label="Number" value={ME.vehicleNumber} />
          <Row label="Max active orders" value={ME.maxActive} />
        </dl>
      </Card>
      <Card className="space-y-3">
        <h2 className="font-display text-base font-semibold text-foreground">Delivery zones</h2>
        <ul className="space-y-1.5 text-sm text-foreground">
          {ME.zones.map((z) => <li key={z}>{z}</li>)}
        </ul>
        <p className="text-xs text-muted-foreground">Zones are set by the Freshly admin team.</p>
      </Card>
    </div>

    <Card className="space-y-3">
      <div>
        <h2 className="font-display text-base font-semibold text-foreground">Documents</h2>
        <p className="text-xs text-muted-foreground">Replacing a document sends it for re-verification</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted text-left">
              {["Document", "Number", "Status date", ""].map((h) => <th key={h} className="px-4 py-3 font-medium text-muted-foreground">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {PARTNER_DOCS.map((d) => (
              <tr key={d.label} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{d.label}</td>
                <td className="px-4 py-3 text-muted-foreground">{d.number}</td>
                <td className="px-4 py-3 text-muted-foreground">{d.date}</td>
                <td className="px-4 py-3"><StatusPill status={d.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
    <DemoNote />
  </WebShell>
);

export default Profile;
