import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Package, CheckCircle2, AlertTriangle } from "lucide-react";
import StatusBadge from "../../components/partner/StatusBadge";
import {
  usePartnerAssignments,
  usePartnerAssignment,
  useUpdateAssignmentStatus,
} from "../../hooks/use-partner";
import { NEXT_STATUS, NEXT_LABEL } from "../../lib/assignmentStatus";

const StatTile = ({ icon: Icon, label, value, sub, tone = "text-foreground" }) => (
  <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-white p-4">
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
    <span className={`text-2xl font-bold ${tone}`}>{value}</span>
    {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
  </div>
);

const PartnerDashboard = () => {
  const { partner } = useOutletContext();
  const [selectedId, setSelectedId] = useState(null);

  const { assignments: active, isLoading } = usePartnerAssignments("ACTIVE");
  const { assignments: today } = usePartnerAssignments("HISTORY", { date: "today" });
  const { assignment: detail } = usePartnerAssignment(selectedId);
  const { mutate: updateStatus, isPending } = useUpdateAssignmentStatus();

  const deliveredToday = today.filter((a) => a.status === "COMPLETED").length;
  const failedToday = today.filter((a) => a.status === "FAILED").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Today</h1>
        <p className="text-sm text-muted-foreground">Your active assignments and today's summary</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile
          icon={Package}
          label="Active orders"
          value={`${partner?.current_active_orders ?? active.length} / ${partner?.max_active_orders ?? "—"}`}
        />
        <StatTile icon={CheckCircle2} label="Delivered today" value={deliveredToday} tone="text-success" />
        <StatTile icon={AlertTriangle} label="Failed attempts" value={failedToday} tone="text-destructive" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold text-foreground">Active assignments</h2>
          </div>

          {isLoading ? (
            <p className="p-5 text-sm text-muted-foreground">Loading…</p>
          ) : active.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No active assignments right now.</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2.5">Order</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5">Drop</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {active.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className={`cursor-pointer border-t border-border transition-colors hover:bg-muted ${
                      selectedId === a.id ? "bg-muted" : ""
                    }`}
                  >
                    <td className="px-5 py-3 font-semibold">#{a.order_id}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{a.customer_name || a.delivery_address}</td>
                    <td className="px-5 py-3 text-right">
                      {NEXT_STATUS[a.status] && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={(event) => {
                            event.stopPropagation();
                            updateStatus({ assignmentId: a.id, status: NEXT_STATUS[a.status] });
                          }}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                        >
                          {NEXT_LABEL[a.status]}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-3 font-bold text-foreground">
            {detail ? `Order #${detail.order_id}` : "Select an order"}
          </h2>

          {!detail ? (
            <p className="text-sm text-muted-foreground">Pick a row on the left to see its status log and customer contact.</p>
          ) : (
            <div className="flex flex-col gap-4">
              <StatusBadge status={detail.status} />

              <ol className="flex flex-col gap-3">
                {(detail.status_history || []).map((step, index) => (
                  <li key={index} className="flex gap-3 text-sm">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                    <span>
                      <span className="block font-semibold text-foreground">{step.status}</span>
                      <span className="text-xs text-muted-foreground">
                        {step.created_at ? new Date(step.created_at).toLocaleTimeString() : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>

              <div className="rounded-xl bg-muted p-3.5 text-sm">
                <p className="mb-1 text-xs text-muted-foreground">Customer</p>
                <p className="font-semibold">{detail.customer_name}</p>
                <p className="text-muted-foreground">{detail.delivery_address}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PartnerDashboard;
