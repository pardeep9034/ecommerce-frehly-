import { Check, Navigation, Phone } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Card, DemoNote, Stepper, StatusPill } from "@/components/partner/PartnerBits";
import { notify } from "@/lib/notify";
import { findOrder } from "@/lib/partnerDemoData";

const RoundButton = ({ label, icon }) => {
  const Icon = icon;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => notify.notWired(label)}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
};

const Pickup = () => {
  const order = findOrder(useParams().orderId);

  return (
    <MobileShell
      back="/partner/home"
      title={`Order #${order.id}`}
      subtitle={`Pickup by ${order.pickupBy} · Slot ${order.slot}`}
      right={<StatusPill status="Assigned" />}
    >
      <div className="flex items-center gap-2 rounded-xl bg-info/10 px-3 py-2.5 text-sm font-semibold text-info">
        <Navigation className="h-4 w-4" /> 1.8 km to store · 6 min
      </div>
      <Stepper step={0} />

      <Card className="space-y-1">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Pick up from</p>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold text-foreground">{order.store.name}</p>
            <p className="text-sm text-muted-foreground">{order.store.address}</p>
            <p className="mt-1 text-xs text-muted-foreground">{order.store.contact.split(" · ")[0]} · Store contact</p>
          </div>
          <RoundButton label="Call store" icon={Phone} />
          <RoundButton label="Navigate to store" icon={Navigation} />
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-foreground">Items packed</h2>
          <span className="text-xs font-semibold text-success">
            {order.count} / {order.count} ready
          </span>
        </div>
        <ul className="divide-y divide-border">
          {order.items.map(([name, qty]) => (
            <li key={name} className="flex items-center gap-3 py-2.5 text-sm">
              <Check className="h-4 w-4 text-success" />
              <span className="flex-1 text-foreground">{name}</span>
              <span className="text-muted-foreground">{qty}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Link
        to={`/partner/orders/${order.id}/deliver`}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white"
      >
        <Check className="h-4 w-4" /> Confirm pickup
      </Link>
      <DemoNote />
    </MobileShell>
  );
};

export default Pickup;
