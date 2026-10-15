import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Avatar, Card, LoadNote, StatusPill } from "@/components/partner/PartnerBits";
import { usePartnerMe } from "@/hooks/use-partner";
import { initialsOf } from "@/lib/assignmentStatus";
import { notify } from "@/lib/notify";
import { signOutPartner } from "@/lib/partnerSession";

const Row = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="font-semibold text-foreground">{value}</dd>
  </div>
);

const Profile = () => {
  const navigate = useNavigate();
  const { partner, error } = usePartnerMe();

  const signOut = async () => {
    await signOutPartner();
    navigate("/partner/login", { replace: true });
  };

  const header = (
    <header className="flex items-center gap-3 bg-primary px-4 py-5 text-white">
      <Avatar initials={initialsOf(partner?.name)} className="h-14 w-14 bg-white/20 text-lg text-white" />
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-xl font-semibold leading-tight">{partner?.name}</h1>
        {partner && (
          <p className="text-xs text-white/80">
            Partner since {new Date(partner.joined_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
          </p>
        )}
      </div>
      {/* /me only answers for an ACTIVE partner, so "Active" is the only status this screen can show. */}
      {partner && <StatusPill status="Active" className="!bg-white/20 !text-white" />}
    </header>
  );

  return (
    <MobileShell header={header} nav>
      {!partner && <LoadNote error={error} what="your profile" />}
      {partner && (
        <>
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-foreground">Vehicle</h2>
              <button type="button" onClick={() => notify.notWired("Editing vehicle details")} className="text-sm font-semibold text-primary">Edit</button>
            </div>
            <dl className="space-y-2">
              <Row label="Phone" value={partner.phone} />
              <Row label="Type" value={partner.vehicle_type} />
              <Row label="Number" value={partner.vehicle_number} />
              <Row label="Max active orders" value={partner.max_active_orders} />
            </dl>
          </Card>

          <Card className="space-y-2">
            <h2 className="font-display text-base font-semibold text-foreground">Delivery zones</h2>
            {partner.zones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No zone assigned yet.</p>
            ) : (
              <ul className="space-y-1.5 text-sm text-foreground">
                {partner.zones.map((z) => <li key={z.id}>{z.name}{z.is_primary && " (primary)"}</li>)}
              </ul>
            )}
          </Card>

          {/* ponytail: no location backend yet, so the switch only says so. A real one needs the phone's GPS and an endpoint. */}
          <Card className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Live location sharing</p>
              <p className="text-xs text-muted-foreground">Not available yet</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={false}
              aria-label="Live location sharing"
              onClick={() => notify.notWired("Live location sharing")}
              className="relative h-6 w-11 rounded-full bg-border"
            >
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white" />
            </button>
          </Card>
        </>
      )}

      <button type="button" onClick={signOut} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 text-sm font-semibold text-destructive">
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </MobileShell>
  );
};

export default Profile;
