import { Camera, Check, PartyPopper } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Card, CodeInput, DemoNote, LoadNote } from "@/components/partner/PartnerBits";
import { usePartnerAssignment, usePartnerAssignments, usePartnerMe, useUpdateAssignmentStatus } from "@/hooks/use-partner";
import { timeOf } from "@/lib/assignmentStatus";
import { notify } from "@/lib/notify";

// Own component so its numbers are only fetched once the order is delivered (the move has already refreshed them).
const Delivered = ({ a }) => {
  const { partner } = usePartnerMe();
  const { total: deliveredToday } = usePartnerAssignments("COMPLETED", { date: "today", limit: 1 });

  return (
    <MobileShell header={<div />}>
      <div className="flex flex-1 flex-col items-center gap-4 pt-16 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success">
          <PartyPopper className="h-9 w-9" />
        </span>
        <h1 className="font-display text-2xl font-bold text-foreground">Delivered!</h1>
        <p className="text-sm text-muted-foreground">
          Order #{a.order_id} handed to {a.customer_name} at {timeOf(a.updated_at)}.
        </p>
        <div className="mt-2 flex w-full gap-3">
          <Card className="flex-1 text-center">
            <p className="font-display text-2xl font-bold">{deliveredToday}</p>
            <p className="text-xs text-muted-foreground">Delivered today</p>
          </Card>
          <Card className="flex-1 text-center">
            <p className="font-display text-2xl font-bold">{partner ? `${partner.current_active_orders} / ${partner.max_active_orders}` : "–"}</p>
            <p className="text-xs text-muted-foreground">Active now</p>
          </Card>
        </div>
        <Link to="/partner/home" className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
          Back to orders
        </Link>
      </div>
    </MobileShell>
  );
};

const Confirm = () => {
  const { assignmentId } = useParams();
  const { assignment: a, error } = usePartnerAssignment(assignmentId);
  const update = useUpdateAssignmentStatus();
  const [code, setCode] = useState("");
  const [photo, setPhoto] = useState("");
  // "sending" keeps the stale-link guard quiet: the refetch after DELIVERED shows the job finished, which must not
  // bounce this screen home before the "Delivered!" view appears.
  const [phase, setPhase] = useState("form");

  if (!a) {
    return (
      <MobileShell back="/partner/home" title="Confirm delivery">
        <LoadNote error={error} />
      </MobileShell>
    );
  }
  if (phase === "done") return <Delivered a={a} />;
  // A stale link (back button, old tab): send the partner to where this job is now.
  if (phase === "form" && a.assignment_status !== "ACTIVE") return <Navigate to="/partner/home" replace />;
  if (a.status !== "OUT_FOR_DELIVERY" && phase === "form") return <Navigate to={`/partner/orders/${a.id}/deliver`} replace />;

  const complete = async () => {
    setPhase("sending");
    try {
      await update.mutateAsync({ assignmentId: a.id, status: "DELIVERED" });
      setPhase("done");
    } catch (e) {
      setPhase("form");
      notify.apiError(e);
    }
  };

  return (
    <MobileShell back={`/partner/orders/${a.id}/deliver`} title="Confirm delivery" subtitle={`Order #${a.order_id} · ${a.customer_name}`}>
      <div className="space-y-2">
        <h2 className="font-display text-lg font-semibold text-foreground">Ask for the delivery code</h2>
        <p className="text-sm text-muted-foreground">The customer can find the 4‑digit code on their order screen in the Freshly app.</p>
      </div>
      <CodeInput length={4} value={code} onChange={setCode} label="Delivery code" />

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-white p-4 hover:bg-muted">
        <Camera className="h-5 w-5 text-muted-foreground" />
        <span className="flex-1 text-sm font-medium text-foreground">
          {photo || "Add doorstep photo"} {!photo && <span className="font-normal text-muted-foreground">(optional)</span>}
        </span>
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setPhoto(e.target.files[0]?.name || "")} />
      </label>

      <button type="button" onClick={() => notify.notWired("Resending the delivery code")} className="text-sm font-semibold text-primary">
        Customer can’t find the code? Resend by SMS
      </button>

      <button
        type="button"
        disabled={code.length !== 4 || phase === "sending"}
        onClick={complete}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground"
      >
        <Check className="h-4 w-4" /> Complete delivery
      </button>
      <DemoNote>The delivery code and doorstep photo aren’t checked or saved yet: the backend issues no code, so any 4 digits complete the delivery.</DemoNote>
    </MobileShell>
  );
};

export default Confirm;
