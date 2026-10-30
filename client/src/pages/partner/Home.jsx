import { Bell, ChevronRight, MapPin, Undo2 } from "lucide-react";
import { Link } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Avatar, Card, StatusPill } from "@/components/partner/PartnerBits";
import { usePartnerAssignments, usePartnerMe, useSetOnline } from "@/hooks/use-partner";
import { STEP_LABEL, initialsOf, timeOf } from "@/lib/assignmentStatus";
import { notify } from "@/lib/notify";

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
  const { partner } = usePartnerMe();
  const { assignments, isLoading, error } = usePartnerAssignments("ACTIVE");
  const { total: deliveredToday } = usePartnerAssignments("COMPLETED", { date: "today", limit: 1 });
  const setOnline = useSetOnline();
  const online = partner?.is_online ?? false;
  const zone = partner?.zones.find((z) => z.is_primary) ?? partner?.zones[0];

  const header = (
    <header className="space-y-3 bg-primary px-4 pb-5 pt-4 text-white">
      <div className="flex items-center gap-3">
        <Avatar initials={initialsOf(partner?.name)} className="h-10 w-10 bg-white/20 text-sm text-white" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg font-semibold leading-tight">Hi, {partner?.name.split(" ")[0]}</h1>
          {zone && (
            <p className="flex items-center gap-1 text-xs text-white/80">
              <MapPin className="h-3 w-3" /> {zone.name}
            </p>
          )}
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
      {/* Offline partners are not offered to staff and are refused by assignment, hand-over and re-assign; orders already held stay. */}
      <button
        type="button"
        disabled={!partner || setOnline.isPending}
        onClick={() => setOnline.mutate(!online, { onError: (e) => notify.apiError(e) })}
        aria-pressed={online}
        className="flex w-full items-center gap-3 rounded-xl bg-white/15 p-3 text-left disabled:opacity-70"
      >
        <span className={`h-3 w-3 rounded-full ${online ? "bg-accent" : "bg-white/40"}`} />
        <span className="flex-1">
          <span className="block text-sm font-semibold">{online ? "You're online" : "You're offline"}</span>
          <span className="block text-xs text-white/80">
            {online ? "The store can assign you new orders" : "Go online to get new orders"}
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
        <Stat label="Active" value={partner?.current_active_orders ?? "–"} suffix={partner && `/ ${partner.max_active_orders}`} />
        <Stat label="Delivered today" value={deliveredToday} />
        <Stat label="Last 7 days" value={partner?.stats.delivered_7d ?? "–"} />
      </div>

      {/* Goods owed back to a store. While any are, the store can't give this partner new orders. */}
      {partner?.returns_due?.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
            <Undo2 className="h-4 w-4" /> Take back to the store
          </h2>
          <p className="text-xs text-muted-foreground">You can't get new orders until these are back. Show the code to the store staff.</p>
          {partner.returns_due.map((r) => (
            <Card key={r.assignment_id} className="space-y-2 border-warning/40">
              <div className="flex items-center justify-between">
                <p className="font-display font-semibold text-foreground">Order #{r.order_id}</p>
                <span className="text-xs text-muted-foreground">
                  {{ DOORSTEP: "Turned away at the door", CUSTOMER: "Customer return" }[r.kind] || "Not delivered"}
                </span>
              </div>
              <Row label="Store" value={[r.store_name, r.store_address].filter(Boolean).join(", ")} />
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Return code</span>
                <span className="font-display text-2xl font-bold tracking-[0.3em] text-foreground">{r.return_code}</span>
              </div>
              <p className="text-xs text-muted-foreground">Since {timeOf(r.due_since)}</p>
            </Card>
          ))}
        </section>
      )}

      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-base font-semibold text-foreground">Your orders</h2>
        <span className="text-xs text-muted-foreground">{assignments.length} active</span>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading your orders…</p>}
      {error && <p className="text-sm text-destructive">Couldn’t load your orders. Reload the page to try again.</p>}
      {!isLoading && !error && assignments.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No orders right now. New ones show up here as soon as the store assigns them.
        </p>
      )}

      {assignments.map((a) => {
        // A return pickup runs the other way: from the customer, back to the store.
        const returnJob = a.kind === "RETURN_PICKUP";
        return (
          <Card key={a.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-display font-semibold text-foreground">Order #{a.order_id}</p>
              <StatusPill status={STEP_LABEL[a.status]} />
            </div>
            <Row label={returnJob ? "Collect" : "Pickup"} value={returnJob ? `${a.customer_name}, ${a.delivery_address}` : a.pickup_name} />
            <Row label={returnJob ? "Return" : "Drop"} value={returnJob ? a.pickup_name : `${a.customer_name}, ${a.delivery_address}`} />
            <p className="text-xs text-muted-foreground">Assigned {timeOf(a.assigned_at)}</p>
            <Link
              to={`/partner/orders/${a.id}/${returnJob ? "collect" : a.status === "ASSIGNED" ? "pickup" : "deliver"}`}
              className="flex h-11 items-center justify-center gap-1 rounded-xl bg-primary text-sm font-bold text-white"
            >
              {returnJob ? "Collect the return" : a.status === "ASSIGNED" ? "Start pickup" : "Continue delivery"} <ChevronRight className="h-4 w-4" />
            </Link>
          </Card>
        );
      })}
    </MobileShell>
  );
};

export default Home;
