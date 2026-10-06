import { useState } from "react";
import WebShell from "@/components/partner/WebShell";
import { Card, DemoNote, StatusPill, Timeline } from "@/components/partner/PartnerBits";
import { FAILED_ORDER_LOG as FAILED, HISTORY } from "@/lib/partnerDemoData";

const STATUSES = ["All", "Delivered", "Failed", "Transferred", "Cancelled"];

const History = () => {
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(FAILED.id);

  const term = search.trim().toLowerCase();
  const rows = HISTORY.filter(
    (h) => (status === "All" || h.status === status) && (!term || h.id.includes(term) || h.customer.toLowerCase().includes(term)),
  );
  const selected = HISTORY.find((h) => h.id === selectedId);
  // Only the failed order has a recorded timeline in the design; others show a one-line summary.
  const isFailed = selected?.id === FAILED.id;

  return (
    <WebShell title="History" subtitle="All assignments you have handled" search={search} onSearch={setSearch}>
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Status filter" className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`h-9 rounded-full px-3 text-xs font-semibold ${status === s ? "bg-primary text-white" : "border border-border bg-white text-foreground"}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <select aria-label="Date range" defaultValue="7" className="ml-auto h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none">
              <option value="1">Today</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted text-left">
                  {["Order", "Customer", "Completed", "Status", "Attempts", "Note"].map((h) => <th key={h} className="px-4 py-3 font-medium text-muted-foreground">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No assignments match.</td></tr>
                )}
                {rows.map((h) => (
                  <tr
                    key={h.id}
                    onClick={() => setSelectedId(h.id)}
                    className={`cursor-pointer border-b border-border last:border-0 hover:bg-muted ${h.id === selectedId ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">#{h.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{h.customer} · {h.area}</td>
                    <td className="px-4 py-3 text-muted-foreground">{h.date}, {h.time}</td>
                    <td className="px-4 py-3"><StatusPill status={h.status} /></td>
                    <td className="px-4 py-3 text-foreground">{h.attempts}</td>
                    <td className="px-4 py-3 text-muted-foreground">{h.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">Showing 1–{rows.length} of 64 · paging isn't wired up yet</p>
        </Card>

        <Card aria-label="Order details" className="space-y-4 self-start">
          {selected ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-foreground">Order #{selected.id}</h2>
                <StatusPill status={selected.status} />
              </div>
              {isFailed ? (
                <>
                  <div className="text-sm">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Customer</p>
                    <p className="mt-1 text-foreground">{FAILED.customer}</p>
                  </div>
                  <div className="rounded-lg bg-destructive/5 p-3 text-sm">
                    <p className="font-semibold text-destructive">{FAILED.attempt}</p>
                    <p className="text-foreground">{FAILED.reason}</p>
                    <p className="text-xs text-muted-foreground">{FAILED.remarks}</p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Status history</p>
                    <Timeline items={FAILED.log} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {selected.customer} · {selected.area}. {selected.note}. Detailed history is only shown for failed orders in this demo.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select an order to see its history.</p>
          )}
        </Card>
      </div>
      <DemoNote />
    </WebShell>
  );
};

export default History;
