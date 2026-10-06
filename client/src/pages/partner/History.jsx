import { useState } from "react";
import MobileShell from "@/components/partner/MobileShell";
import { Card, DemoNote, StatusPill } from "@/components/partner/PartnerBits";
import { HISTORY } from "@/lib/partnerDemoData";

const RANGES = ["Today", "This week", "This month"];
const COUNTED = ["Delivered", "Failed", "Transferred"];

const History = () => {
  const [range, setRange] = useState("Today");
  // The demo only has two days of rows, so week/month show all of them.
  const rows = range === "Today" ? HISTORY.filter((h) => h.day === "Today") : HISTORY;
  const days = [...new Set(rows.map((h) => h.day))];

  return (
    <MobileShell title="History" nav>
      <div role="group" aria-label="Range" className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`h-9 rounded-full px-4 text-xs font-semibold ${range === r ? "bg-primary text-white" : "border border-border bg-white text-foreground"}`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {COUNTED.map((s) => (
          <Card key={s} className="p-3 text-center">
            <p className="font-display text-xl font-bold text-foreground">{rows.filter((h) => h.status === s).length}</p>
            <p className="text-[11px] text-muted-foreground">{s}</p>
          </Card>
        ))}
      </div>

      {days.map((day) => (
        <div key={day} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{day}</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-white shadow-card">
            {rows.filter((h) => h.day === day).map((h) => (
              <li key={h.id} className="flex items-center gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">#{h.id} · {h.area}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {h.time}
                    {h.status !== "Delivered" && ` · ${h.attempts !== "—" ? `Attempt ${h.attempts} · ` : ""}${h.note}`}
                  </p>
                </div>
                <StatusPill status={h.status} />
              </li>
            ))}
          </ul>
        </div>
      ))}
      <DemoNote />
    </MobileShell>
  );
};

export default History;
