import { Check, MapPin, Navigation, Phone, XCircle } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Avatar, Card, LoadNote, RoundLink, SavingNote, StatusPill } from "@/components/partner/PartnerBits";
import { useFinishPickup, useJobAction, usePartnerAssignment } from "@/hooks/use-partner";
import { STEP_LABEL, initialsOf, mapsUrl, timeOf } from "@/lib/assignmentStatus";

// A return pickup: collect the customer's approved returns, then take them to the store (Home shows the return code).
const Collect = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { assignment: a, error } = usePartnerAssignment(assignmentId);
  const finish = useFinishPickup();
  const job = useJobAction(a);

  if (!a) {
    return (
      <MobileShell back="/partner/home" title="Return pickup">
        <LoadNote error={error} />
      </MobileShell>
    );
  }
  if (a.assignment_status !== "ACTIVE" || a.kind !== "RETURN_PICKUP") return <Navigate to="/partner/home" replace />;

  const done = async (collected) => {
    if (await job.run(() => finish.mutateAsync({ assignmentId: a.id, collected }))) navigate("/partner/home");
  };

  return (
    <MobileShell
      back="/partner/home"
      title={`Order #${a.order_id}`}
      subtitle={`Assigned ${timeOf(a.assigned_at)}`}
      right={<StatusPill status={STEP_LABEL[a.status]} />}
    >
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

      <Card className="space-y-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Collect</p>
        {(a.order_items || []).map((item, i) => (
          <div key={i} className="flex justify-between text-sm text-foreground">
            <span>{item.name}</span>
            <span className="text-muted-foreground">{item.qty}</span>
          </div>
        ))}
      </Card>

      <div className="space-y-2.5">
        <button
          type="button"
          disabled={job.busy}
          onClick={() => done(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-60"
        >
          <Check className="h-4 w-4" /> Collected
        </button>
        <button
          type="button"
          disabled={job.busy}
          onClick={() => done(false)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 text-sm font-semibold text-destructive disabled:opacity-60"
        >
          <XCircle className="h-4 w-4" /> Couldn’t collect
        </button>
        <SavingNote phase={job.phase} />
      </div>
    </MobileShell>
  );
};

export default Collect;
