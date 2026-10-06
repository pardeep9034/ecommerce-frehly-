import { Camera, Check, PartyPopper } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Card, CodeInput, DemoNote } from "@/components/partner/PartnerBits";
import { notify } from "@/lib/notify";
import { ME, findOrder } from "@/lib/partnerDemoData";

const Confirm = () => {
  const order = findOrder(useParams().orderId);
  const [code, setCode] = useState("");
  const [photo, setPhoto] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <MobileShell header={<div />}>
        <div className="flex flex-1 flex-col items-center gap-4 pt-16 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success">
            <PartyPopper className="h-9 w-9" />
          </span>
          <h1 className="font-display text-2xl font-bold text-foreground">Delivered!</h1>
          <p className="text-sm text-muted-foreground">
            Order #{order.id} handed to {order.customer} at 8:02 AM. 13 minutes ahead of slot.
          </p>
          <div className="mt-2 flex w-full gap-3">
            <Card className="flex-1 text-center">
              <p className="font-display text-2xl font-bold">{ME.deliveredToday + 1}</p>
              <p className="text-xs text-muted-foreground">Delivered today</p>
            </Card>
            <Card className="flex-1 text-center">
              <p className="font-display text-2xl font-bold">{ME.active - 1} / {ME.maxActive}</p>
              <p className="text-xs text-muted-foreground">Active now</p>
            </Card>
          </div>
          <Link to="/partner/home" className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
            Back to orders
          </Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell back={`/partner/orders/${order.id}/deliver`} title="Confirm delivery" subtitle={`Order #${order.id} · ${order.customer}`}>
      <div className="space-y-2">
        <h2 className="font-display text-lg font-semibold text-foreground">Ask for the delivery code</h2>
        <p className="text-sm text-muted-foreground">The customer can find the 4‑digit code on their order screen in the Freshly app.</p>
      </div>
      <CodeInput length={4} value={code} onChange={setCode} label="Delivery code" />

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-white p-4 hover:bg-muted">
        <Camera className="h-5 w-5 text-muted-foreground" />
        <span className="flex-1 text-sm font-medium text-foreground">
          {photo || "Add doorstep photo"} {!photo && <span className="font-normal text-muted-foreground">(optional)</span>}
        </span>
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setPhoto(e.target.files[0]?.name || "")} />
      </label>

      <button type="button" onClick={() => notify.notWired("Resending the delivery code")} className="text-sm font-semibold text-primary">
        Customer can’t find the code? Resend by SMS
      </button>

      <button
        type="button"
        disabled={code.length !== 4}
        onClick={() => setDone(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground"
      >
        <Check className="h-4 w-4" /> Complete delivery
      </button>
      <DemoNote>Demo — any 4 digits are accepted; the delivery code isn't checked by the backend yet.</DemoNote>
    </MobileShell>
  );
};

export default Confirm;
