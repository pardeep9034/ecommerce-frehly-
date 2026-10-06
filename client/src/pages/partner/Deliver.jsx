import { ArrowLeftRight, Check, MapPin, Navigation, Phone, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Card, DemoNote, Stepper, StatusPill } from "@/components/partner/PartnerBits";
import { notify } from "@/lib/notify";
import { findOrder } from "@/lib/partnerDemoData";

const Deliver = () => {
  const order = findOrder(useParams().orderId);
  const initials = order.customer.split(" ").map((w) => w[0]).join("");

  return (
    <MobileShell
      back="/partner/home"
      title={`Order #${order.id}`}
      subtitle={`Deliver by ${order.due} · Slot ${order.slot}`}
      right={<StatusPill status="Out for delivery" />}
    >
      <div className="flex items-center gap-3 rounded-xl bg-primary p-4 text-white">
        <div className="flex-1">
          <p className="font-display text-2xl font-bold">{order.eta}</p>
          <p className="text-xs text-white/80">{order.distance} · via Airport Road</p>
        </div>
        <button
          type="button"
          onClick={() => notify.notWired("Turn-by-turn navigation")}
          className="flex h-10 items-center gap-2 rounded-lg bg-white/15 px-3 text-sm font-semibold"
        >
          <Navigation className="h-4 w-4" /> Navigate
        </button>
      </div>
      <Stepper step={2} />

      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent-foreground">{initials}</span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold text-foreground">{order.customer}</p>
            <p className="text-xs text-muted-foreground">{order.phone}</p>
          </div>
          <button
            type="button"
            aria-label="Call customer"
            onClick={() => notify.notWired("Calling the customer")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <Phone className="h-4 w-4" />
          </button>
        </div>
        <p className="flex items-start gap-2 text-sm text-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          {order.address}
        </p>
      </Card>

      <Card className="space-y-1">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">{order.count} items · Order total</span>
          <span className="font-display text-lg font-bold text-foreground">₹{order.total}</span>
        </div>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-success">
          <Check className="h-3.5 w-3.5" /> Paid online · no cash to collect
        </p>
      </Card>

      <div className="space-y-2.5">
        <Link to={`/partner/orders/${order.id}/confirm`} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white">
          <Check className="h-4 w-4" /> Mark as delivered
        </Link>
        <div className="grid grid-cols-2 gap-2.5">
          <Link to={`/partner/orders/${order.id}/failed`} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-destructive/30 text-sm font-semibold text-destructive">
            <XCircle className="h-4 w-4" /> Couldn’t deliver
          </Link>
          <Link to="/partner/handover?tab=out" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-foreground">
            <ArrowLeftRight className="h-4 w-4" /> Hand over
          </Link>
        </div>
      </div>
      <DemoNote />
    </MobileShell>
  );
};

export default Deliver;
