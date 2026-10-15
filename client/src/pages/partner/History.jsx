import { useState } from "react";
import MobileShell from "@/components/partner/MobileShell";
import { Card, StatusPill } from "@/components/partner/PartnerBits";
import { usePartnerAssignments } from "@/hooks/use-partner";
import { STEP_LABEL, dayOf, timeOf } from "@/lib/assignmentStatus";

// ponytail: the backend filters finished work by "today" only; week / month need a new `date` value there.
const RANGES = [
  { label: "Today", date: "today" },
  { label: "All time", date: undefined },
];
const COUNTED = [
  ["COMPLETED", "Delivered"],
  ["FAILED", "Failed"],
  ["TRANSFERRED", "Transferred"],
];
const LIMIT = 20;

// Own component so each tile can call the hook; limit 1 because only the `total` is used.
const CountCard = ({ status, label, date }) => {
  const { total } = usePartnerAssignments(status, { date, limit: 1 });
  return (
    <Card className="p-3 text-center">
      <p className="font-display text-xl font-bold text-foreground">{total}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </Card>
  );
};

const History = () => {
  const [range, setRange] = useState(RANGES[0]);
  const [page, setPage] = useState(1);
  const { assignments, total, isLoading, error } = usePartnerAssignments("HISTORY", { date: range.date, page, limit: LIMIT });
  const days = [...new Set(assignments.map((a) => dayOf(a.updated_at)))];

  const pick = (r) => {
    setRange(r);
    setPage(1);
  };

  return (
    <MobileShell title="History" nav>
      <div role="group" aria-label="Range" className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r.label}
            type="button"
            onClick={() => pick(r)}
            className={`h-9 rounded-full px-4 text-xs font-semibold ${range === r ? "bg-primary text-white" : "border border-border bg-white text-foreground"}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {COUNTED.map(([status, label]) => (
          <CountCard key={status} status={status} label={label} date={range.date} />
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-destructive">Couldn’t load your history. Reload the page to try again.</p>}
      {!isLoading && !error && assignments.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nothing here yet. Finished deliveries show up in this list.
        </p>
      )}

      {days.map((day) => (
        <div key={day} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{day}</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-white shadow-card">
            {assignments.filter((a) => dayOf(a.updated_at) === day).map((a) => (
              <li key={a.id} className="flex items-center gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">#{a.order_id} · {a.customer_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {timeOf(a.updated_at)}
                    {a.status === "DELIVERY_FAILED" && a.last_attempt_reason && ` · ${a.last_attempt_reason}`}
                  </p>
                </div>
                <StatusPill status={STEP_LABEL[a.status]} />
              </li>
            ))}
          </ul>
        </div>
      ))}

      {total > LIMIT && (
        <div className="flex items-center justify-between text-sm font-semibold">
          <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="text-primary disabled:text-muted-foreground">
            Newer
          </button>
          <span className="text-xs font-normal text-muted-foreground">Page {page} of {Math.ceil(total / LIMIT)}</span>
          <button type="button" disabled={page * LIMIT >= total} onClick={() => setPage(page + 1)} className="text-primary disabled:text-muted-foreground">
            Older
          </button>
        </div>
      )}
    </MobileShell>
  );
};

export default History;
