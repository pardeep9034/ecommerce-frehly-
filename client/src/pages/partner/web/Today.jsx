import { Navigation, Phone } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import WebShell from "@/components/partner/WebShell";
import { Card, DemoNote, StatusPill, Timeline } from "@/components/partner/PartnerBits";
import { notify } from "@/lib/notify";
import { INCOMING_HANDOVER as IN, ME, ORDERS } from "@/lib/partnerDemoData";

const Stat = ({ label, value, suffix, hint }) => (
  <Card>
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-1 font-display text-3xl font-semibold text-foreground">
      {value}
      {suffix && <span className="text-base font-medium text-muted-foreground"> {suffix}</span>}
    </p>
    <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
  </Card>
);

const ACTIONS = { Assigned: "Start pickup", "Out for delivery": "Mark delivered", Handover: "Confirm receipt" };

const Today = () => {
  const [selectedId, setSelectedId] = useState("10488");
  const selected = ORDERS.find((o) => o.id === selectedId);
  const log = [
    ["Assigned by store", selected.assigned],
    ["Picked up", "7:38 AM · Dark Store Phase 7"],
    ["Out for delivery", "7:40 AM"],
    ["Delivered", `Due by ${selected.due}`],
  ].map(([title, sub], i) => ({ title, sub, current: i === selected.step, pending: i > selected.step }));

  return (
    <WebShell title="Today" subtitle="Thursday, 24 Sep · Slot 7:00–9:00 AM">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Active orders" value={ME.active} suffix={`/ ${ME.maxActive}`} hint={`Capacity left: ${ME.maxActive - ME.active}`} />
        <Stat label="Delivered today" value={ME.deliveredToday} hint="Since 6:00 AM" />
        <Stat label="Failed attempts" value={1} hint="#10476 · rescheduled" />
        <Stat label="Handovers" value={1} hint="Awaiting your confirmation" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-foreground">Active assignments</h2>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">Zone MOH-70</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    {["Order", "Status", "Pickup", "Drop", "Slot", ""].map((h) => <th key={h} className="py-2 pr-4 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {ORDERS.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => setSelectedId(o.id)}
                      className={`cursor-pointer border-b border-border last:border-0 hover:bg-muted ${o.id === selectedId ? "bg-primary/5" : ""}`}
                    >
                      <td className="py-3 pr-4 font-semibold text-foreground">#{o.id}</td>
                      <td className="py-3 pr-4"><StatusPill status={o.status} /></td>
                      <td className="py-3 pr-4 text-muted-foreground">{o.status === "Handover" ? "Amit S. · Sector 71 gate" : "Dark Store · Phase 7"}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{o.short}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{o.slot}</td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            notify.notWired(ACTIONS[o.status]);
                          }}
                          className="font-semibold text-primary hover:underline"
                        >
                          {ACTIONS[o.status]}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-foreground">Order #{selected.id} · status log</h2>
              <StatusPill status={selected.status} />
            </div>
            <Timeline items={log} />
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <div className="flex-1 text-sm">
                <p className="font-semibold text-foreground">Customer</p>
                <p className="text-muted-foreground">{selected.customer} · {selected.phone}</p>
                <p className="text-muted-foreground">{selected.address}</p>
              </div>
              <button type="button" onClick={() => notify.notWired("Calling the customer")} className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold">
                <Phone className="h-4 w-4" /> Call
              </button>
              <button type="button" onClick={() => notify.notWired("Navigation")} className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold">
                <Navigation className="h-4 w-4" /> Navigate
              </button>
            </div>
          </Card>
        </div>

        <aside className="space-y-5 self-start">
          <Card className="bg-primary text-white">
            <p className="text-xs text-white/80">Next stop</p>
            <p className="mt-1 font-display text-lg font-semibold">{ORDERS[1].short}</p>
            <p className="text-sm text-white/80">{ORDERS[1].distance}</p>
          </Card>
          <Card className="space-y-3 border-violet/30 bg-violet/5">
            <h2 className="font-display text-base font-semibold text-violet">Incoming handover</h2>
            <p className="text-sm text-foreground">
              {IN.from} confirmed handing over <b>#{IN.order}</b> at {IN.meet} ({IN.meetDistance.replace(" away", "")}). Reason: bike puncture.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => notify.notWired("Declining a handover")} className="h-9 rounded-lg border border-border bg-white text-sm font-semibold">Decline</button>
              <button type="button" onClick={() => notify.notWired("Confirming receipt")} className="h-9 rounded-lg bg-primary text-sm font-semibold text-white">Confirm receipt</button>
            </div>
          </Card>
          <Link to="/partner/home" className="block text-center text-xs font-semibold text-primary hover:underline">Open the phone view</Link>
          <DemoNote />
        </aside>
      </div>
    </WebShell>
  );
};

export default Today;
