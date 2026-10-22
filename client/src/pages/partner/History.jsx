import { useState } from "react";
import MobileShell from "@/components/partner/MobileShell";
import { Card, StatusPill } from "@/components/partner/PartnerBits";
import { usePartnerAssignments } from "@/hooks/use-partner";
import { STEP_LABEL, dayOf, timeOf, ymd } from "@/lib/assignmentStatus";

const RANGES = [
  { label: "Today", days: 1 },
  { label: "7 days", days: 7 },
  { label: "All time" },
];
const COUNTED = [
  ["COMPLETED", "Delivered"],
  ["FAILED", "Failed"],
  ["TRANSFERRED", "Transferred"],
];
const LIMIT = 20;

const History = () => {
  const [range, setRange] = useState(RANGES[0]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  // Today counts as one of the days, so "7 days" starts six days back.
  const from = range.days && ymd(new Date(Date.now() - (range.days - 1) * 24 * 60 * 60 * 1000));
  const { assignments, total, counts, isLoading, error } = usePartnerAssignments("HISTORY", { from, search: search.trim(), page, limit: LIMIT });
  const finishedAt = (a) => a.completed_at ?? a.updated_at;
  const days = [...new Set(assignments.map((a) => dayOf(finishedAt(a))))];

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

      <input
        type="search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        maxLength={50}
        placeholder="Order number or customer name"
        aria-label="Search history"
        className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary"
      />

      <div className="grid grid-cols-3 gap-2.5">
        {COUNTED.map(([status, label]) => (
          <Card key={status} className="p-3 text-center">
            <p className="font-display text-xl font-bold text-foreground">{counts[status] ?? 0}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
          </Card>
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
            {assignments.filter((a) => dayOf(finishedAt(a)) === day).map((a) => (
              <li key={a.id} className="flex items-center gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">#{a.order_id} · {a.customer_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {timeOf(finishedAt(a))}
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
