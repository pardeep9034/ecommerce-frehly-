import { Check, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Avatar, Card, LoadNote, RoundLink, SavingNote, StatusPill, Timeline } from "@/components/partner/PartnerBits";
import { useHandoverAction, useHandoverCandidates, usePartnerAssignments, usePartnerHandovers, useRequestHandover } from "@/hooks/use-partner";
import { HANDOVER_LABEL, initialsOf, mapsUrl, timeOf } from "@/lib/assignmentStatus";
import { notify } from "@/lib/notify";

const FIELD = "mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal outline-none focus:border-primary";
const OPEN = ["PENDING", "OLD_PARTNER_CONFIRMED"];

// Request → the giver hands it over → the receiver confirms; or it is called off before the receipt.
const timelineOf = (h, dir) => {
  const other = h.other_partner?.name ?? "The other partner";
  const [giver, receiver] = dir === "in" ? [other, "You"] : ["You", other];
  const offBy = { YOU: "You called it off", OTHER: `${other} ${dir === "in" ? "withdrew it" : "declined"}`, STAFF: "Called off by the store" };
  const items = [
    { title: `${giver} asked for a handover`, sub: timeOf(h.created_at) },
    h.old_partner_confirmed_at
      ? { title: `${giver} handed it over`, sub: timeOf(h.old_partner_confirmed_at) }
      : { title: `${giver} hands it over`, sub: "At the meet point", pending: true },
  ];
  if (h.status === "CANCELLED") return [...items.filter((i) => !i.pending), { title: offBy[h.cancelled_by], sub: timeOf(h.cancelled_at) }];
  items.push(
    h.receipt_confirmed_at
      ? { title: `${receiver} confirmed receipt`, sub: timeOf(h.receipt_confirmed_at) }
      : { title: `${receiver} confirm${receiver === "You" ? "" : "s"} receipt`, sub: "The order moves over as Out for delivery", pending: true },
  );
  return items;
};

const HandoverCard = ({ h, dir }) => {
  const navigate = useNavigate();
  const step = useHandoverAction(h, dir);
  const open = OPEN.includes(h.status);
  const other = h.other_partner;

  const run = async (name, done) => {
    const res = await step.run(name);
    if (res) done(res);
  };
  const receive = () => run("confirm-receipt", (res) => navigate(`/partner/orders/${res.data.id}/deliver`));
  const cancel = () => run("cancel", () => notify.success(dir === "in" ? "Handover declined" : "Handover withdrawn"));
  const handedOver = () => run("confirm-handover", () => notify.success(`Waiting for ${other?.name ?? "them"} to confirm`));

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display font-semibold text-foreground">Order #{h.order_id}</p>
        <StatusPill status={HANDOVER_LABEL[h.status]} />
      </div>
      <div className="flex items-center gap-3">
        <Avatar initials={initialsOf(other?.name)} className="h-10 w-10 text-sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{dir === "in" ? "From" : "To"} {other?.name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">Reason: {h.reason}</p>
        </div>
        {other?.phone && <RoundLink href={`tel:${other.phone}`} label={`Call ${other.name}`} icon={Phone} />}
      </div>
      {open && h.handover_latitude != null && h.handover_longitude != null && (
        <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1">Meet point</span>
          <a href={mapsUrl(h.handover_latitude, h.handover_longitude)} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary">Map</a>
        </div>
      )}
      <Timeline items={timelineOf(h, dir)} />
      {h.customer_name && (
        <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Deliver to</span> {h.customer_name} · {h.delivery_address}</p>
      )}
      {open && (
        <div className="grid grid-cols-[1fr_2fr] gap-2.5">
          <button type="button" disabled={step.busy} onClick={cancel} className="h-11 rounded-xl border border-border text-sm font-semibold disabled:opacity-60">
            {dir === "in" ? "Decline" : "Withdraw"}
          </button>
          {dir === "in" ? (
            <button
              type="button"
              disabled={step.busy || h.status !== "OLD_PARTNER_CONFIRMED"}
              onClick={receive}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-60"
            >
              <Check className="h-4 w-4" /> {h.status === "OLD_PARTNER_CONFIRMED" ? "Confirm receipt" : "Waiting for hand-over"}
            </button>
          ) : h.status === "PENDING" ? (
            <button type="button" disabled={step.busy} onClick={handedOver} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-60">
              <Check className="h-4 w-4" /> I’ve handed it over
            </button>
          ) : (
            <p className="flex h-11 items-center justify-center text-center text-xs text-muted-foreground">Waiting for {other?.name ?? "them"} to confirm</p>
          )}
        </div>
      )}
      <SavingNote phase={step.busy && "saving"} />
    </Card>
  );
};

const HandoverList = ({ dir, handovers, isLoading, error, empty }) => {
  if (isLoading || error) return <LoadNote error={error} what="handovers" />;
  if (handovers.length === 0) return empty ? <p className="text-sm text-muted-foreground">{empty}</p> : null;
  return handovers.map((h) => <HandoverCard key={h.id} h={h} dir={dir} />);
};

const Outgoing = ({ preselect }) => {
  const sent = usePartnerHandovers("out");
  const { assignments, isLoading } = usePartnerAssignments("ACTIVE");
  const request = useRequestHandover();
  // Only picked-up orders can be handed over (the backend checks too), and only one request per order at a time.
  const busy = new Set(sent.handovers.filter((h) => OPEN.includes(h.status)).map((h) => h.assignment_id));
  const handable = assignments.filter((a) => a.status === "PICKED_UP" && !busy.has(a.id));
  const [choice, setChoice] = useState(preselect);
  const assignmentId = handable.some((a) => a.id === choice) ? choice : handable[0]?.id;
  const { candidates, isLoading: loadingCandidates } = useHandoverCandidates(assignmentId);
  const [partnerId, setPartnerId] = useState(null);
  const receiver = candidates.find((p) => p.id === partnerId) ?? candidates[0];
  const [reason, setReason] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (reason.trim().length < 3) return notify.error("Add a reason for the handover");
    request.mutate(
      { assignmentId, new_delivery_partner_id: receiver.id, reason: reason.trim() },
      {
        onSuccess: () => {
          notify.success(`Request sent to ${receiver.name}`);
          setReason("");
        },
        onError: (e) => notify.apiError(e),
      },
    );
  };

  return (
    <>
      <HandoverList dir="out" {...sent} />
      {isLoading ? (
        <LoadNote />
      ) : handable.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders to hand over. Only orders you have picked up and not yet started delivering can be handed over.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold text-foreground">
            Order to hand over
            <select value={assignmentId} onChange={(e) => setChoice(e.target.value)} className={FIELD}>
              {handable.map((a) => <option key={a.id} value={a.id}>#{a.order_id} · {a.customer_name} · Picked up</option>)}
            </select>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">Only orders you have picked up can be handed over.</span>
          </label>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold text-foreground">Online partners in your zone</legend>
            {loadingCandidates ? (
              <LoadNote />
            ) : candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one in your zone is online with room for another order right now.</p>
            ) : (
              candidates.map((p) => (
                <label key={p.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-[1.5px] px-3 ${receiver?.id === p.id ? "border-primary bg-primary/5" : "border-border bg-white"}`}>
                  <input type="radio" name="np" checked={receiver?.id === p.id} onChange={() => setPartnerId(p.id)} className="h-4 w-4 accent-primary" />
                  <Avatar initials={initialsOf(p.name)} />
                  <span>
                    <span className="block text-sm font-semibold text-foreground">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">{p.vehicle_type} · {p.current_active_orders} / {p.max_active_orders} active</span>
                  </span>
                </label>
              ))
            )}
          </fieldset>

          <label className="block text-sm font-semibold text-foreground">
            Reason
            <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} placeholder="e.g. Vehicle breakdown" className={FIELD} />
          </label>

          <button
            type="submit"
            disabled={!receiver || request.isPending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> Send handover request
          </button>
        </form>
      )}
    </>
  );
};

const Handover = () => {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "out" ? "out" : "in";
  const incoming = usePartnerHandovers("in");
  const waiting = incoming.handovers.filter((h) => OPEN.includes(h.status)).length;
  const tabs = [
    { key: "in", label: "Incoming", count: waiting },
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
            {t.count > 0 && <span className="rounded-full bg-violet/10 px-1.5 text-[11px] text-violet">{t.count}</span>}
          </button>
        ))}
      </div>
      {tab === "in" ? (
        <HandoverList dir="in" {...incoming} empty="No handovers for you right now." />
      ) : (
        <Outgoing preselect={params.get("assignment")} />
      )}
    </MobileShell>
  );
};

export default Handover;
