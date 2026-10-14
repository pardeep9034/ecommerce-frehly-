import { useState } from "react";
import StatusBadge from "../../components/partner/StatusBadge";
import Pagination from "../../components/common/Pagination";
import { usePartnerAssignments, usePartnerAssignment } from "../../hooks/use-partner";

const FILTERS = [
  { label: "All", value: "HISTORY" },
  { label: "Delivered", value: "COMPLETED" },
  { label: "Failed", value: "FAILED" },
  { label: "Transferred", value: "TRANSFERRED" },
  { label: "Cancelled", value: "CANCELLED" },
];
const PAGE_SIZE = 8;

const PartnerHistory = () => {
  const [filter, setFilter] = useState("HISTORY");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const { assignments, total, isLoading } = usePartnerAssignments(filter, { page, limit: PAGE_SIZE });
  const { assignment: detail } = usePartnerAssignment(selectedId);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">History</h1>
        <p className="text-sm text-muted-foreground">All assignments you have handled</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => {
              setFilter(f.value);
              setPage(1);
            }}
            className={`h-9 rounded-full border px-3.5 text-sm font-semibold transition-colors ${
              filter === f.value
                ? "border-primary bg-primary text-white"
                : "border-border bg-white text-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-3">
          <section className="overflow-hidden rounded-2xl border border-border bg-white">
            {isLoading ? (
              <p className="p-5 text-sm text-muted-foreground">Loading…</p>
            ) : assignments.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No assignments in this filter yet.</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-2.5">Order</th>
                    <th className="px-5 py-2.5">Customer</th>
                    <th className="px-5 py-2.5">Completed</th>
                    <th className="px-5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => setSelectedId(a.id)}
                      className={`cursor-pointer border-t border-border transition-colors hover:bg-muted ${
                        selectedId === a.id ? "bg-muted" : ""
                      }`}
                    >
                      <td className="px-5 py-3 font-semibold">#{a.order_id}</td>
                      <td className="px-5 py-3">{a.customer_name}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {a.updated_at ? new Date(a.updated_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <Pagination currentPage={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} />
        </div>

        <aside className="rounded-2xl border border-border bg-white p-5">
          {!detail ? (
            <p className="text-sm text-muted-foreground">Select a row to see its details.</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-foreground">Order #{detail.order_id}</h2>
                <StatusBadge status={detail.status} />
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Customer</p>
                <p className="font-semibold">{detail.customer_name}</p>
                <p className="text-sm text-muted-foreground">{detail.delivery_address}</p>
              </div>
              {detail.last_attempt_reason && (
                <div className="rounded-xl bg-destructive/5 p-3.5">
                  <p className="text-xs font-bold uppercase tracking-wide text-destructive">Failure reason</p>
                  <p className="text-sm">{detail.last_attempt_reason}</p>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default PartnerHistory;
