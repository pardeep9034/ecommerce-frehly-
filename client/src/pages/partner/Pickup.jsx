import { Check, Navigation, Phone } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Card, LoadNote, RoundLink, Stepper, StatusPill } from "@/components/partner/PartnerBits";
import { usePartnerAssignment, useUpdateAssignmentStatus } from "@/hooks/use-partner";
import { NEXT_LABEL, NEXT_STATUS, STEP_INDEX, STEP_LABEL, mapsUrl, timeOf } from "@/lib/assignmentStatus";
import { notify } from "@/lib/notify";

const Pickup = () => {
  const { assignmentId } = useParams();
  const { assignment: a, error } = usePartnerAssignment(assignmentId);
  const update = useUpdateAssignmentStatus();

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

  // No navigate here: the refetch after the move flips a.status, and the guard above sends the partner on to Deliver.
  const confirm = () =>
    update.mutate({ assignmentId: a.id, status: NEXT_STATUS[a.status] }, { onError: (e) => notify.apiError(e) });

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

      <button
        type="button"
        disabled={update.isPending}
        onClick={confirm}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-60"
      >
        <Check className="h-4 w-4" /> {NEXT_LABEL[a.status]}
      </button>
    </MobileShell>
  );
};

export default Pickup;
