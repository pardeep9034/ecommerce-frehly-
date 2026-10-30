import { Check, Navigation, Phone } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Card, LoadNote, RoundLink, Stepper, StatusPill } from "@/components/partner/PartnerBits";
import { usePartnerAssignment } from "@/hooks/use-partner";
import { STEP_INDEX, STEP_LABEL, mapsUrl, timeOf } from "@/lib/assignmentStatus";

const Pickup = () => {
  const { assignmentId } = useParams();
  // Polls: the store's handover flips a.status to PICKED_UP, and the guard below moves on to Deliver.
  const { assignment: a, error } = usePartnerAssignment(assignmentId, 5000);

  if (!a) {
    return (
      <MobileShell back="/partner/home" title="Pickup">
        <LoadNote error={error} />
      </MobileShell>
    );
  }
  // A stale link (back button, old tab): send the partner to where this job is now.
  if (a.assignment_status !== "ACTIVE") return <Navigate to="/partner/home" replace />;
  if (a.status !== "ASSIGNED") return <Navigate to={`/partner/orders/${a.id}/deliver`} replace />;

  return (
    <MobileShell
      back="/partner/home"
      title={`Order #${a.order_id}`}
      subtitle={`Assigned ${timeOf(a.assigned_at)}`}
      right={<StatusPill status={STEP_LABEL[a.status]} />}
    >
      <Stepper step={STEP_INDEX[a.status]} />

      <Card className="space-y-1">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Pick up from</p>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold text-foreground">{a.pickup_name}</p>
            <p className="text-sm text-muted-foreground">{a.pickup_address}</p>
            {a.pickup_contact_name && <p className="mt-1 text-xs text-muted-foreground">{a.pickup_contact_name} · Store contact</p>}
          </div>
          {a.pickup_contact_phone && <RoundLink href={`tel:${a.pickup_contact_phone}`} label="Call store" icon={Phone} />}
          <RoundLink href={mapsUrl(a.pickup_latitude, a.pickup_longitude, a.pickup_address)} label="Navigate to store" icon={Navigation} />
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-foreground">Items to collect</h2>
          {a.order_items && <span className="text-xs font-semibold text-muted-foreground">{a.order_items.length} items</span>}
        </div>
        {a.order_items ? (
          <ul className="divide-y divide-border">
            {a.order_items.map((item, i) => (
              <li key={`${item.name}-${i}`} className="flex items-center gap-3 py-2.5 text-sm">
                <Check className="h-4 w-4 text-success" />
                <span className="flex-1 text-foreground">{item.name}</span>
                <span className="text-muted-foreground">{item.qty}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">The item list isn’t available right now. The store can tell you what to collect.</p>
        )}
      </Card>

      <Card className="text-center">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Pickup code</p>
        <p className="my-2 font-display text-4xl font-bold tracking-[0.3em] text-foreground">{a.pickup_code ?? "----"}</p>
        <p className="text-sm text-muted-foreground">Show this code at the store. The order moves on once they hand it over.</p>
      </Card>
    </MobileShell>
  );
};

export default Pickup;
