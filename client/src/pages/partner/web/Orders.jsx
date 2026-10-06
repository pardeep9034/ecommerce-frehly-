import { ArrowLeftRight, Check, XCircle } from "lucide-react";
import { useState } from "react";
import WebShell from "@/components/partner/WebShell";
import { Card, DemoNote, Stepper, StatusPill } from "@/components/partner/PartnerBits";
import { notify } from "@/lib/notify";
import { ORDERS } from "@/lib/partnerDemoData";

const FILTERS = [
  ["Active", () => true],
  ["To pick up", (o) => o.status === "Assigned"],
  ["On the way", (o) => o.status === "Out for delivery"],
];

const Orders = () => {
  const [filter, setFilter] = useState("Active");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(ORDERS[0].id);

  const term = search.trim().toLowerCase();
  const matches = (o) => !term || o.id.includes(term) || o.customer.toLowerCase().includes(term);
  const test = FILTERS.find(([name]) => name === filter)[1];
  const visible = ORDERS.filter((o) => test(o) && matches(o));
  const order = ORDERS.find((o) => o.id === selectedId) || ORDERS[0];

  return (
    <WebShell title="Orders" subtitle={`${ORDERS.length} assigned to you right now`} search={search} onSearch={setSearch}>
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <section aria-label="Assigned orders" className="space-y-3 self-start">
          <div role="group" aria-label="Filter" className="flex flex-wrap gap-2">
            {FILTERS.map(([name, fn]) => (
              <button
                key={name}
                type="button"
                onClick={() => setFilter(name)}
                className={`h-9 rounded-full px-3 text-xs font-semibold ${filter === name ? "bg-primary text-white" : "border border-border bg-white text-foreground"}`}
              >
                {name} · {ORDERS.filter(fn).length}
              </button>
            ))}
          </div>
          {visible.length === 0 && <p className="rounded-xl border border-border bg-white p-6 text-center text-sm text-muted-foreground">No orders match.</p>}
          {visible.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelectedId(o.id)}
              className={`block w-full rounded-xl border bg-white p-4 text-left shadow-card ${o.id === order.id ? "border-primary" : "border-border"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-foreground">#{o.id}</span>
                <StatusPill status={o.status} />
              </div>
              <p className="mt-1.5 text-sm text-foreground">{o.short}</p>
              <p className="text-xs text-muted-foreground">
                {o.status === "Assigned" ? `Pickup by ${o.pickupBy.replace(" AM", "")} · ${o.count} items` : o.status === "Handover" ? "Awaiting your receipt" : `Due ${o.due.replace(" AM", "")} · ${o.distance}`}
              </p>
            </button>
          ))}
        </section>

        <Card className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">Order #{order.id}</h2>
              <p className="text-xs text-muted-foreground">Slot {order.slot} · assigned {order.assigned}</p>
            </div>
            <StatusPill status={order.status} />
          </div>
          <Stepper step={order.step} />

          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Pick up from</p>
              <p className="mt-1 font-semibold text-foreground">{order.store.name}</p>
              <p className="text-muted-foreground">{order.store.address} · {order.store.contact}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Deliver to</p>
              <p className="mt-1 font-semibold text-foreground">{order.customer} · {order.phone}</p>
              <p className="text-muted-foreground">{order.address}</p>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                {["Item", "Qty", "Store"].map((h) => <th key={h} className="py-2 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {order.items.map(([name, qty]) => (
                <tr key={name} className="border-b border-border last:border-0">
                  <td className="py-2.5 text-foreground">{name}</td>
                  <td className="py-2.5 text-muted-foreground">{qty}</td>
                  <td className="py-2.5 font-medium text-success">Packed</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-wrap items-center gap-2.5">
            <button type="button" onClick={() => notify.notWired("Confirming pickup")} className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white">
              <Check className="h-4 w-4" /> Confirm pickup
            </button>
            <button type="button" onClick={() => notify.notWired("Reporting failed attempts")} className="flex h-10 items-center gap-2 rounded-lg border border-destructive/30 px-4 text-sm font-semibold text-destructive">
              <XCircle className="h-4 w-4" /> Couldn’t deliver
            </button>
            <button type="button" onClick={() => notify.notWired("Handover requests")} className="flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold">
              <ArrowLeftRight className="h-4 w-4" /> Hand over
            </button>
            <span className="ml-auto text-xs text-muted-foreground">Payment: paid online · no cash to collect.</span>
          </div>
        </Card>
      </div>
      <DemoNote />
    </WebShell>
  );
};

export default Orders;
