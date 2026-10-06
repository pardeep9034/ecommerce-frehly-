import { Info, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Card, DemoNote, StatusPill } from "@/components/partner/PartnerBits";
import { notify } from "@/lib/notify";
import { FAILED_REASONS, findOrder } from "@/lib/partnerDemoData";

const Failed = () => {
  const order = findOrder(useParams().orderId);
  const navigate = useNavigate();
  const [reason, setReason] = useState(FAILED_REASONS[0]);
  const [remarks, setRemarks] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (reason === "Other" && !remarks.trim()) {
      notify.error("Add a remark for “Other”");
      return;
    }
    notify.notWired("Reporting failed attempts");
    navigate("/partner/home");
  };

  return (
    <MobileShell
      back="/partner/home"
      title={`Order #${order.id}`}
      subtitle={`Deliver by ${order.due}`}
      right={<StatusPill status="Out for delivery" />}
    >
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">Couldn’t deliver?</h2>
              <p className="text-xs text-muted-foreground">Order #{order.id} · Attempt 1 of 3</p>
            </div>
            <Link to={`/partner/orders/${order.id}/deliver`} aria-label="Close" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
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
              placeholder="Called twice, no answer. Gate locked."
              className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm font-normal outline-none focus:border-primary"
            />
          </label>

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0" /> Store will be notified to reschedule or reassign.
          </p>
          <button type="submit" className="h-12 w-full rounded-xl bg-destructive text-sm font-bold text-white">
            Report failed attempt
          </button>
        </form>
      </Card>
      <DemoNote />
    </MobileShell>
  );
};

export default Failed;
