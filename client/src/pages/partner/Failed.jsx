import { Info, X } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Card, LoadNote, StatusPill } from "@/components/partner/PartnerBits";
import { usePartnerAssignment, useUpdateAssignmentStatus } from "@/hooks/use-partner";
import { STEP_LABEL, timeOf } from "@/lib/assignmentStatus";
import { notify } from "@/lib/notify";
import { FAILED_REASONS } from "@/lib/partnerDemoData";

const Failed = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { assignment: a, error } = usePartnerAssignment(assignmentId);
  const update = useUpdateAssignmentStatus();
  const [reason, setReason] = useState(FAILED_REASONS[0]);
  const [remarks, setRemarks] = useState("");

  if (!a) {
    return (
      <MobileShell back="/partner/home" title="Couldn’t deliver">
        <LoadNote error={error} />
      </MobileShell>
    );
  }
  // Reported already (or finished some other way): nothing left to report.
  if (a.assignment_status !== "ACTIVE") return <Navigate to="/partner/home" replace />;

  const submit = async (event) => {
    event.preventDefault();
    const note = remarks.trim();
    if (reason === "Other" && note.length < 3) {
      notify.error("Add a remark for “Other”");
      return;
    }
    // mutateAsync, not mutate's callbacks: the guard above unmounts this screen as soon as the refetch shows the job
    // finished, and mutate's own callbacks do not run after that.
    // The server keeps one reason text (3–255 characters); the remark rides along after the picked reason.
    try {
      await update.mutateAsync({
        assignmentId: a.id,
        status: "DELIVERY_FAILED",
        reason: reason === "Other" ? note : note ? `${reason} — ${note}` : reason,
      });
      notify.success("Failed attempt reported");
      navigate("/partner/home", { replace: true });
    } catch (e) {
      notify.apiError(e);
    }
  };

  return (
    <MobileShell
      back="/partner/home"
      title={`Order #${a.order_id}`}
      subtitle={`Assigned ${timeOf(a.assigned_at)}`}
      right={<StatusPill status={STEP_LABEL[a.status]} />}
    >
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">Couldn’t deliver?</h2>
              <p className="text-xs text-muted-foreground">Order #{a.order_id} · {a.customer_name}</p>
            </div>
            <Link to={`/partner/orders/${a.id}/deliver`} aria-label="Close" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </Link>
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold text-foreground">Select a reason</legend>
            {FAILED_REASONS.map((r) => (
              <label
                key={r}
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-[1.5px] px-3.5 text-sm ${
                  reason === r ? "border-destructive bg-destructive/10 font-semibold" : "border-border bg-white"
                }`}
              >
                <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="h-4 w-4 accent-destructive" />
                {r}
              </label>
            ))}
          </fieldset>

          <label className="block text-sm font-semibold text-foreground">
            Remarks
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Called twice, no answer. Gate locked."
              className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm font-normal outline-none focus:border-primary"
            />
          </label>

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0" /> The store sees this and decides whether to reschedule or reassign.
          </p>
          <button type="submit" disabled={update.isPending} className="h-12 w-full rounded-xl bg-destructive text-sm font-bold text-white disabled:opacity-60">
            Report failed attempt
          </button>
        </form>
      </Card>
    </MobileShell>
  );
};

export default Failed;
