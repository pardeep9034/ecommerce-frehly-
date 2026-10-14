import { useEffect, useState } from "react";
import StatusBadge from "../../components/partner/StatusBadge";
import {
  usePartnerAssignments,
  usePartnerAssignment,
  useUpdateAssignmentStatus,
} from "../../hooks/use-partner";
import { NEXT_STATUS, NEXT_LABEL } from "../../lib/assignmentStatus";

const PartnerOrders = () => {
  const { assignments, isLoading } = usePartnerAssignments("ACTIVE");
  const [selectedId, setSelectedId] = useState(null);
  const [failReason, setFailReason] = useState("");
  const [showFailForm, setShowFailForm] = useState(false);

  useEffect(() => {
    if (!selectedId && assignments.length > 0) {
      setSelectedId(assignments[0].id);
    }
  }, [assignments, selectedId]);

  const { assignment: detail } = usePartnerAssignment(selectedId);
  const { mutate: updateStatus, isPending } = useUpdateAssignmentStatus();

  const submitFailure = () => {
    if (!failReason.trim()) return;
    updateStatus(
      { assignmentId: selectedId, status: "DELIVERY_FAILED", reason: failReason.trim() },
      { onSuccess: () => setShowFailForm(false) }
    );
    setFailReason("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground">{assignments.length} assigned to you right now</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <section className="flex flex-col gap-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : assignments.length === 0 ? (
            <p className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
              No orders assigned right now.
            </p>
          ) : (
            assignments.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setSelectedId(a.id);
                  setShowFailForm(false);
                }}
                className={`flex flex-col gap-1.5 rounded-2xl border bg-white p-4 text-left transition-colors ${
                  selectedId === a.id ? "border-primary" : "border-border hover:border-primary/40"
                }`}
              >
                <span className="flex items-center justify-between">
                  <span className="font-bold text-foreground">#{a.order_id}</span>
                  <StatusBadge status={a.status} />
                </span>
                <span className="text-sm font-semibold text-foreground">{a.customer_name}</span>
                <span className="text-xs text-muted-foreground">{a.delivery_address}</span>
              </button>
            ))
          )}
        </section>

        <section className="rounded-2xl border border-border bg-white p-6">
          {!detail ? (
            <p className="text-sm text-muted-foreground">Select an order to see its details.</p>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Order #{detail.order_id}</h2>
                <StatusBadge status={detail.status} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-muted p-4">
                  <p className="mb-1 text-xs text-muted-foreground">Pick up from</p>
                  <p className="font-semibold">{detail.pickup_name}</p>
                  <p className="text-sm text-muted-foreground">{detail.pickup_address}</p>
                </div>
                <div className="rounded-xl bg-muted p-4">
                  <p className="mb-1 text-xs text-muted-foreground">Deliver to</p>
                  <p className="font-semibold">{detail.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{detail.delivery_address}</p>
                </div>
              </div>

              {detail.order_items?.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-2">Item</th>
                        <th className="px-4 py-2">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.order_items.map((item, index) => (
                        <tr key={index} className="border-t border-border">
                          <td className="px-4 py-2.5">{item.name}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{item.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {NEXT_STATUS[detail.status] && !showFailForm && (
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => updateStatus({ assignmentId: detail.id, status: NEXT_STATUS[detail.status] })}
                    className="flex-1 rounded-xl bg-primary px-4 py-3 font-bold text-white disabled:opacity-60"
                  >
                    {NEXT_LABEL[detail.status]}
                  </button>
                  {detail.status === "OUT_FOR_DELIVERY" && (
                    <button
                      type="button"
                      onClick={() => setShowFailForm(true)}
                      className="flex-1 rounded-xl border border-border px-4 py-3 font-semibold text-destructive"
                    >
                      Couldn't deliver
                    </button>
                  )}
                </div>
              )}

              {showFailForm && (
                <div className="flex flex-col gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <label className="text-sm font-semibold text-foreground">Why couldn't this be delivered?</label>
                  <textarea
                    value={failReason}
                    onChange={(event) => setFailReason(event.target.value)}
                    rows={2}
                    className="rounded-lg border border-border p-2.5 text-sm outline-none focus:border-destructive"
                    placeholder="e.g. Customer not reachable"
                  />
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      disabled={isPending || !failReason.trim()}
                      onClick={submitFailure}
                      className="rounded-lg bg-destructive px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                    >
                      Report failed attempt
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFailForm(false)}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PartnerOrders;
