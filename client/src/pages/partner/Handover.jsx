import { Check, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Avatar, Card, DemoNote, StatusPill, Timeline } from "@/components/partner/PartnerBits";
import { notify } from "@/lib/notify";
import { INCOMING_HANDOVER as IN, NEARBY_PARTNERS, ORDERS } from "@/lib/partnerDemoData";

const FIELD = "mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal outline-none focus:border-primary";

const Incoming = () => (
  <Card className="space-y-4">
    <div className="flex items-center justify-between">
      <p className="font-display font-semibold text-foreground">Order #{IN.order}</p>
      <StatusPill status="Handover" />
    </div>
    <div className="flex items-center gap-3">
      <Avatar initials={IN.initials} className="h-10 w-10 text-sm" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{IN.from}</p>
        <p className="text-xs text-muted-foreground">Reason: {IN.reason}</p>
      </div>
      <button type="button" aria-label="Call Amit" onClick={() => notify.notWired("Calling the other partner")} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Phone className="h-4 w-4" />
      </button>
    </div>
    <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1">Meet point · {IN.meetDistance}, {IN.meet}</span>
      <button type="button" onClick={() => notify.notWired("Map view")} className="text-xs font-semibold text-primary">Map</button>
    </div>
    <Timeline items={IN.timeline} />
    <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Deliver to</span> {IN.deliverTo}</p>
    <div className="grid grid-cols-[1fr_2fr] gap-2.5">
      <button type="button" onClick={() => notify.notWired("Declining a handover")} className="h-11 rounded-xl border border-border text-sm font-semibold">Decline</button>
      <Link to={`/partner/orders/${IN.order}/deliver`} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white">
        <Check className="h-4 w-4" /> Confirm receipt
      </Link>
    </div>
  </Card>
);

const Outgoing = () => {
  // Only picked-up orders that are out with this partner can be passed on.
  const handable = ORDERS.filter((o) => o.status === "Out for delivery");
  const [partner, setPartner] = useState(NEARBY_PARTNERS[0].id);
  const [reason, setReason] = useState("Vehicle breakdown");

  const submit = (event) => {
    event.preventDefault();
    if (!reason.trim()) return notify.error("Add a reason for the handover");
    notify.notWired("Sending handover requests");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-semibold text-foreground">
        Order to hand over
        <select className={FIELD}>
          {handable.map((o) => <option key={o.id}>#{o.id} · {o.short.split(" · ")[0]} · Picked up</option>)}
        </select>
        <span className="mt-1 block text-xs font-normal text-muted-foreground">Only orders you have picked up can be handed over.</span>
      </label>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold text-foreground">Nearby partners in your zone</legend>
        {NEARBY_PARTNERS.map((p) => (
          <label key={p.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-[1.5px] px-3 ${partner === p.id ? "border-primary bg-primary/5" : "border-border bg-white"}`}>
            <input type="radio" name="np" checked={partner === p.id} onChange={() => setPartner(p.id)} className="h-4 w-4 accent-primary" />
            <Avatar initials={p.initials} />
            <span>
              <span className="block text-sm font-semibold text-foreground">{p.name}</span>
              <span className="block text-xs text-muted-foreground">{p.sub}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <label className="block text-sm font-semibold text-foreground">
        Reason
        <input value={reason} onChange={(e) => setReason(e.target.value)} className={FIELD} />
      </label>

      <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white">
        <Send className="h-4 w-4" /> Send handover request
      </button>
    </form>
  );
};

const Handover = () => {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "out" ? "out" : "in";
  const tabs = [
    { key: "in", label: "Incoming", count: 1 },
    { key: "out", label: "Hand over an order" },
  ];

  return (
    <MobileShell title="Handover" nav>
      <div role="tablist" aria-label="Handover direction" className="grid grid-cols-2 rounded-xl bg-muted p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setParams(t.key === "out" ? { tab: "out" } : {}, { replace: true })}
            className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${tab === t.key ? "bg-white text-primary shadow-card" : "text-muted-foreground"}`}
          >
            {t.label}
            {t.count && <span className="rounded-full bg-violet/10 px-1.5 text-[11px] text-violet">{t.count}</span>}
          </button>
        ))}
      </div>
      {tab === "in" ? <Incoming /> : <Outgoing />}
      <DemoNote />
    </MobileShell>
  );
};

export default Handover;
