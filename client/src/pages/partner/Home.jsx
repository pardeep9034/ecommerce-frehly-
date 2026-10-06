import { Bell, ChevronRight, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Avatar, Card, DemoNote, StatusPill } from "@/components/partner/PartnerBits";
import { notify } from "@/lib/notify";
import { INCOMING_HANDOVER, ME, ORDERS } from "@/lib/partnerDemoData";

const Stat = ({ label, value, suffix }) => (
  <div className="flex-1 rounded-xl border border-border bg-white p-3 text-center shadow-card">
    <p className="font-display text-xl font-bold text-foreground">
      {value}
      {suffix && <span className="text-sm font-medium text-muted-foreground"> {suffix}</span>}
    </p>
    <p className="text-[11px] text-muted-foreground">{label}</p>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex gap-3 text-sm">
    <span className="w-11 shrink-0 text-xs font-semibold uppercase text-muted-foreground">{label}</span>
    <span className="text-foreground">{value}</span>
  </div>
);

const Home = () => {
  const [online, setOnline] = useState(true);
  // Handover orders live under the incoming-handover card, not the "Your orders" list.
  const orders = ORDERS.filter((o) => o.status !== "Handover");

  const header = (
    <header className="space-y-3 bg-primary px-4 pb-5 pt-4 text-white">
      <div className="flex items-center gap-3">
        <Avatar initials={ME.initials} className="h-10 w-10 bg-white/20 text-sm text-white" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg font-semibold leading-tight">Hi, {ME.name.split(" ")[0]}</h1>
          <p className="flex items-center gap-1 text-xs text-white/80">
            <MapPin className="h-3 w-3" /> {ME.zone} zone
          </p>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => notify.notWired("Partner notifications")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => setOnline((v) => !v)}
        aria-pressed={online}
        className="flex w-full items-center gap-3 rounded-xl bg-white/15 p-3 text-left"
      >
        <span className={`h-3 w-3 rounded-full ${online ? "bg-accent" : "bg-white/40"}`} />
        <span className="flex-1">
          <span className="block text-sm font-semibold">{online ? "You're online" : "You're offline"}</span>
          <span className="block text-xs text-white/80">
            {online ? "Receiving new orders in your zone" : "Tap to start receiving orders"}
          </span>
        </span>
        <span className={`relative h-6 w-11 rounded-full ${online ? "bg-accent" : "bg-white/30"}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${online ? "left-[22px]" : "left-0.5"}`} />
        </span>
      </button>
    </header>
  );

  return (
    <MobileShell header={header} nav>
      <div className="flex gap-2.5">
        <Stat label="Active" value={ME.active} suffix={`/ ${ME.maxActive}`} />
        <Stat label="Delivered today" value={ME.deliveredToday} />
        <Stat label="Current slot" value={ME.slot} />
      </div>

      <Link to="/partner/handover" className="flex items-center gap-3 rounded-xl border border-violet/30 bg-violet/10 p-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-violet">Handover request</p>
          <p className="text-xs text-foreground">
            {INCOMING_HANDOVER.fromShort} wants to pass you order #{INCOMING_HANDOVER.order}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-violet" />
      </Link>

      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-base font-semibold text-foreground">Your orders</h2>
        <span className="text-xs text-muted-foreground">{orders.length} active</span>
      </div>

      {orders.map((o) => (
        <Card key={o.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-display font-semibold text-foreground">Order #{o.id}</p>
            <StatusPill status={o.status} />
          </div>
          <Row label="Pickup" value={o.store.name} />
          <Row label="Drop" value={`${o.short}, Mohali`} />
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>{o.count} items</span>
            <span>{o.distance}</span>
            <span className="ml-auto font-semibold text-foreground">Due {o.due}</span>
          </div>
          <Link
            to={o.step === 0 ? `/partner/orders/${o.id}/pickup` : `/partner/orders/${o.id}/deliver`}
            className="flex h-11 items-center justify-center gap-1 rounded-xl bg-primary text-sm font-bold text-white"
          >
            {o.step === 0 ? "Start pickup" : "Continue delivery"} <ChevronRight className="h-4 w-4" />
          </Link>
        </Card>
      ))}
      <DemoNote />
    </MobileShell>
  );
};

export default Home;
