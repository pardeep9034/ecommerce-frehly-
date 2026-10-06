import { LogOut } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Avatar, Card, DemoNote, StatusPill } from "@/components/partner/PartnerBits";
import { notify } from "@/lib/notify";
import { ME } from "@/lib/partnerDemoData";

const Row = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="font-semibold text-foreground">{value}</dd>
  </div>
);

const Profile = () => {
  const [sharing, setSharing] = useState(true);

  const header = (
    <header className="flex items-center gap-3 bg-primary px-4 py-5 text-white">
      <Avatar initials={ME.initials} className="h-14 w-14 bg-white/20 text-lg text-white" />
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-xl font-semibold leading-tight">{ME.name}</h1>
        <p className="text-xs text-white/80">Partner since Mar 2026</p>
      </div>
      <StatusPill status="Active" className="!bg-white/20 !text-white" />
    </header>
  );

  return (
    <MobileShell header={header} nav>
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-foreground">Vehicle</h2>
          <button type="button" onClick={() => notify.notWired("Editing vehicle details")} className="text-sm font-semibold text-primary">Edit</button>
        </div>
        <dl className="space-y-2">
          <Row label="Type" value={ME.vehicleLabel} />
          <Row label="Number" value={ME.vehicleNumber} />
          <Row label="Max active orders" value={ME.maxActive} />
        </dl>
      </Card>

      <Card className="space-y-2">
        <h2 className="font-display text-base font-semibold text-foreground">Delivery zones</h2>
        <ul className="space-y-1.5 text-sm text-foreground">
          {ME.zones.map((z) => <li key={z}>{z}</li>)}
        </ul>
      </Card>

      <Card className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Live location sharing</p>
          <p className="text-xs text-muted-foreground">Last updated 20 seconds ago</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={sharing}
          aria-label="Live location sharing"
          onClick={() => setSharing((v) => !v)}
          className={`relative h-6 w-11 rounded-full ${sharing ? "bg-primary" : "bg-border"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${sharing ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </Card>

      <Link to="/partner/login" className="flex h-12 items-center justify-center gap-2 rounded-xl border border-destructive/30 text-sm font-semibold text-destructive">
        <LogOut className="h-4 w-4" /> Log out
      </Link>
      <DemoNote />
    </MobileShell>
  );
};

export default Profile;
