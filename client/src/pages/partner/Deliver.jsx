import { ArrowLeftRight, Check, MapPin, Navigation, Phone, XCircle } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Avatar, Card, LoadNote, RoundLink, SavingNote, Stepper, StatusPill } from "@/components/partner/PartnerBits";
import { useJobAction, usePartnerAssignment, useUpdateAssignmentStatus } from "@/hooks/use-partner";
import { NEXT_LABEL, NEXT_STATUS, STEP_INDEX, STEP_LABEL, initialsOf, mapsUrl, timeOf } from "@/lib/assignmentStatus";

const Deliver = () => {
  const { assignmentId } = useParams();
  const { assignment: a, error } = usePartnerAssignment(assignmentId);
  const update = useUpdateAssignmentStatus();
  const job = useJobAction(a);

  if (!a) {
    return (
      <MobileShell back="/partner/home" title="Delivery">
        <LoadNote error={error} />
      </MobileShell>
    );
  }
  // A stale link (back button, old tab): send the partner to where this job is now.
  if (a.assignment_status !== "ACTIVE") return <Navigate to="/partner/home" replace />;
  if (a.kind === "RETURN_PICKUP") return <Navigate to={`/partner/orders/${a.id}/collect`} replace />;
  if (a.status === "ASSIGNED") return <Navigate to={`/partner/orders/${a.id}/pickup`} replace />;

  // PICKED_UP -> OUT_FOR_DELIVERY is one tap here; OUT_FOR_DELIVERY -> DELIVERED goes through the code screen.
  const startDelivery = () => job.run(() => update.mutateAsync({ assignmentId: a.id, status: NEXT_STATUS[a.status] }));

  return (
    <MobileShell
      back="/partner/home"
      title={`Order #${a.order_id}`}
      subtitle={`Assigned ${timeOf(a.assigned_at)}`}
      right={<StatusPill status={STEP_LABEL[a.status]} />}
    >
      <Stepper step={STEP_INDEX[a.status]} />

      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar initials={initialsOf(a.customer_name)} className="h-10 w-10 text-sm" />
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold text-foreground">{a.customer_name}</p>
            {a.customer_phone && <p className="text-xs text-muted-foreground">{a.customer_phone}</p>}
          </div>
          {a.customer_phone && <RoundLink href={`tel:${a.customer_phone}`} label="Call customer" icon={Phone} />}
        </div>
        <div className="flex items-start gap-3">
          <p className="flex min-w-0 flex-1 items-start gap-2 text-sm text-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            {a.delivery_address}
          </p>
          <RoundLink href={mapsUrl(a.delivery_latitude, a.delivery_longitude, a.delivery_address)} label="Navigate to customer" icon={Navigation} />
        </div>
      </Card>

      {a.order_items && <Card className="text-sm text-foreground">{a.order_items.length} items in this order</Card>}

      <div className="space-y-2.5">
        {a.status === "OUT_FOR_DELIVERY" ? (
          <Link to={`/partner/orders/${a.id}/confirm`} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white">
            <Check className="h-4 w-4" /> {NEXT_LABEL[a.status]}
          </Link>
        ) : (
          <button
            type="button"
            disabled={job.busy}
            onClick={startDelivery}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-60"
          >
            <Navigation className="h-4 w-4" /> {NEXT_LABEL[a.status]}
          </button>
        )}
        <SavingNote phase={job.phase} />
        {/* Only a picked-up order can be handed over: once out for delivery, the backend refuses. */}
        <div className={`grid gap-2.5 ${a.status === "PICKED_UP" ? "grid-cols-2" : ""}`}>
          <Link to={`/partner/orders/${a.id}/failed`} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-destructive/30 text-sm font-semibold text-destructive">
            <XCircle className="h-4 w-4" /> Couldn’t deliver
          </Link>
          {a.status === "PICKED_UP" && (
            <Link to={`/partner/handover?tab=out&assignment=${a.id}`} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-foreground">
              <ArrowLeftRight className="h-4 w-4" /> Hand over
            </Link>
          )}
        </div>
      </div>
    </MobileShell>
  );
};

export default Deliver;
