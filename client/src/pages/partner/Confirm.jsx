import { Banknote, Camera, Check, Minus, PackageX, PartyPopper, Plus, QrCode, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Card, CodeInput, LoadNote, SavingNote } from "@/components/partner/PartnerBits";
import {
  useDoorQr,
  useDoorQrStatus,
  useJobAction,
  usePartnerAssignment,
  usePartnerAssignments,
  usePartnerMe,
  useUpdateAssignmentStatus,
  useUploadDoorPhoto,
} from "@/hooks/use-partner";
import { DOOR_REJECT_REASONS, rupees, timeOf } from "@/lib/assignmentStatus";
import { notify } from "@/lib/notify";

// How long a QR waits before the partner is offered "Retry QR" or "Switch to cash". The QR itself lives longer
// (order-service closes it at 16 min), so a customer who pays just after this still counts.
const QR_WAIT_MS = 3 * 60 * 1000;

// Own component so its numbers are only fetched once the order is delivered (the move has already refreshed them).
const Delivered = ({ a }) => {
  const { partner } = usePartnerMe();
  const { total: deliveredToday } = usePartnerAssignments("COMPLETED", { date: "today", limit: 1 });

  return (
    <MobileShell header={<div />}>
      <div className="flex flex-1 flex-col items-center gap-4 pt-16 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success">
          <PartyPopper className="h-9 w-9" />
        </span>
        <h1 className="font-display text-2xl font-bold text-foreground">Delivered!</h1>
        <p className="text-sm text-muted-foreground">
          Order #{a.order_id} handed to {a.customer_name} at {timeOf(a.updated_at)}.
        </p>
        <div className="mt-2 flex w-full gap-3">
          <Card className="flex-1 text-center">
            <p className="font-display text-2xl font-bold">{deliveredToday}</p>
            <p className="text-xs text-muted-foreground">Delivered today</p>
          </Card>
          <Card className="flex-1 text-center">
            <p className="font-display text-2xl font-bold">{partner ? `${partner.current_active_orders} / ${partner.max_active_orders}` : "–"}</p>
            <p className="text-xs text-muted-foreground">Active now</p>
          </Card>
        </div>
        <Link to="/partner/home" className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
          Back to orders
        </Link>
      </div>
    </MobileShell>
  );
};

// One line of the order: how many the customer turned away, and why.
const RejectRow = ({ item, value, locked, onChange }) => {
  const quantity = value?.quantity ?? 0;
  const set = (next) => onChange(next.quantity > 0 ? next : null);
  return (
    <div className="space-y-2 border-b border-border py-3 last:border-0">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            {item.quantity} {item.unit} · {rupees(item.unit_price)} each
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`One less ${item.name} turned away`}
            disabled={locked || quantity === 0}
            onClick={() => set({ ...value, quantity: quantity - 1 })}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            aria-label={`One more ${item.name} turned away`}
            disabled={locked || quantity >= item.quantity}
            onClick={() => set({ reason: DOOR_REJECT_REASONS[0].code, note: "", ...value, quantity: quantity + 1 })}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      {quantity > 0 && (
        <div className="space-y-2">
          <select
            value={value.reason}
            disabled={locked}
            onChange={(e) => set({ ...value, reason: e.target.value })}
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
          >
            {DOOR_REJECT_REASONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
          {value.reason === "OTHER" && (
            <input
              value={value.note}
              disabled={locked}
              maxLength={500}
              onChange={(e) => set({ ...value, note: e.target.value })}
              placeholder="What was wrong?"
              className="h-10 w-full rounded-lg border border-border px-3 text-sm"
            />
          )}
        </div>
      )}
    </div>
  );
};

const Confirm = () => {
  const { assignmentId } = useParams();
  const { assignment: a, error } = usePartnerAssignment(assignmentId);
  const update = useUpdateAssignmentStatus();
  const job = useJobAction(a);
  const uploadPhoto = useUploadDoorPhoto();
  const doorQr = useDoorQr();
  const [code, setCode] = useState("");
  const [showRejects, setShowRejects] = useState(false);
  const [rejected, setRejected] = useState({}); // order_item_id -> { quantity, reason, note }
  const [method, setMethod] = useState(null); // "CASH" | "UPI", pay on delivery only
  const [qr, setQr] = useState(null); // the QR on screen: { id, image_url, amount, shownAt }
  const [timedOut, setTimedOut] = useState(false);
  const [paidUpi, setPaidUpi] = useState(false);
  const [cashTaken, setCashTaken] = useState(false);
  // "sending" keeps the stale-link guard quiet: the refetch after DELIVERED shows the job finished, which must not
  // bounce this screen home before the "Delivered!" view appears.
  const [phase, setPhase] = useState("form");

  const qrStatus = useDoorQrStatus(a?.id, Boolean(qr) && !paidUpi && phase === "form");
  useEffect(() => {
    if (qrStatus?.paid) {
      setPaidUpi(true);
      setQr(null);
    }
  }, [qrStatus?.paid]);
  useEffect(() => {
    if (!qr) return undefined;
    const timer = setTimeout(() => setTimedOut(true), Math.max(0, QR_WAIT_MS - (Date.now() - qr.shownAt)));
    return () => clearTimeout(timer);
  }, [qr]);

  if (!a) {
    return (
      <MobileShell back="/partner/home" title="Confirm delivery">
        <LoadNote error={error} />
      </MobileShell>
    );
  }
  if (phase === "done") return <Delivered a={a} />;
  // A stale link (back button, old tab): send the partner to where this job is now.
  if (phase === "form" && a.assignment_status !== "ACTIVE") return <Navigate to="/partner/home" replace />;
  if (a.status !== "OUT_FOR_DELIVERY" && phase === "form") return <Navigate to={`/partner/orders/${a.id}/deliver`} replace />;

  const door = a.door;
  const items = door?.items ?? [];
  const lines = Object.entries(rejected).map(([id, r]) => ({
    order_item_id: Number(id),
    quantity: r.quantity,
    reason: r.reason,
    ...(r.note.trim() ? { note: r.note.trim() } : {}),
  }));
  const rejectedValue = lines.reduce((sum, line) => sum + (items.find((i) => i.order_item_id === line.order_item_id)?.unit_price ?? 0) * line.quantity, 0);
  // An estimate for the screen; the QR's amount and the final check come from order-service.
  const due = door?.pay_at_door ? Math.max(0, Math.round((door.amount_due - rejectedValue) * 100) / 100) : 0;
  const upiDone = Boolean(door?.paid_by_upi) || paidUpi;
  // Once a QR exists (or was paid) the amount is fixed, so what was turned away can't change.
  const locked = Boolean(qr) || upiDone;
  const allRejected = items.length > 0 && items.every((item) => (rejected[item.order_item_id]?.quantity ?? 0) >= item.quantity);
  const photoMissing = lines.length > 0 && !door?.has_photo;
  const noteMissing = lines.some((line) => line.reason === "OTHER" && (line.note?.length ?? 0) < 3);
  const payNeeded = Boolean(door?.pay_at_door) && due > 0;
  const paid = !payNeeded || upiDone || (method === "CASH" && cashTaken);
  const canComplete = code.length === 4 && !photoMissing && !noteMissing && !allRejected && paid && phase === "form";

  // The amount changes with every line, so cash collected for the old amount is asked for again.
  const setLine = (id, value) => {
    setCashTaken(false);
    setRejected((current) => {
      const next = { ...current };
      if (value) next[id] = value;
      else delete next[id];
      return next;
    });
  };

  const takePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      await uploadPhoto.mutateAsync({ assignmentId: a.id, file });
      notify.success("Photo saved");
    } catch (e) {
      notify.apiError(e, "Couldn't save the photo");
    }
  };

  // Also "Retry QR": order-service closes the old QR (counting it if it was paid after all) and makes a new one.
  const showQr = async () => {
    try {
      const view = (await doorQr.mutateAsync({ assignmentId: a.id, method: "POST", rejectedItems: lines })).data;
      setMethod("UPI");
      setTimedOut(false);
      if (view.paid) {
        setPaidUpi(true);
        setQr(null);
      } else {
        setQr({ ...view.qr, shownAt: Date.now() });
      }
    } catch (e) {
      notify.apiError(e, "Couldn't make a QR");
    }
  };

  // Closes the QR first, so it can't be paid after the cash is taken. A payment that landed meanwhile still counts.
  const switchToCash = async () => {
    try {
      const view = (await doorQr.mutateAsync({ assignmentId: a.id, method: "DELETE" })).data;
      setQr(null);
      setTimedOut(false);
      if (view.paid) {
        setPaidUpi(true);
        notify.success("The customer paid by UPI");
      } else {
        setMethod("CASH");
      }
    } catch (e) {
      notify.apiError(e, "Couldn't close the QR");
    }
  };

  const complete = async () => {
    setPhase("sending");
    const saved = await job.run(() =>
      update.mutateAsync({
        assignmentId: a.id,
        status: "DELIVERED",
        delivery_code: code,
        rejected_items: lines,
        ...(door?.pay_at_door ? { payment_method: upiDone ? "UPI" : "CASH" } : {}),
      }),
    );
    setPhase(saved ? "done" : "form");
  };

  return (
    <MobileShell back={`/partner/orders/${a.id}/deliver`} title="Confirm delivery" subtitle={`Order #${a.order_id} · ${a.customer_name}`}>
      <div className="space-y-2">
        <h2 className="font-display text-lg font-semibold text-foreground">Ask for the delivery code</h2>
        <p className="text-sm text-muted-foreground">The customer can find the 4‑digit code on their order screen in the Freshly app.</p>
      </div>
      <CodeInput length={4} value={code} onChange={setCode} label="Delivery code" />

      {items.length > 0 && (
        <Card className="space-y-1">
          <button type="button" onClick={() => setShowRejects((v) => !v)} className="flex w-full items-center gap-3 text-left">
            <PackageX className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-semibold text-foreground">
              {lines.length ? `${lines.length} item${lines.length > 1 ? "s" : ""} turned away` : "Customer turned something away?"}
            </span>
            <span className="text-xs font-semibold text-primary">{showRejects ? "Hide" : "Choose"}</span>
          </button>
          {showRejects && (
            <div>
              {locked && (
                <p className="pt-2 text-xs text-muted-foreground">
                  {upiDone ? "Already paid by UPI for these, so they can't change." : "The QR is for this amount: switch to cash to change these."}
                </p>
              )}
              {items.map((item) => (
                <RejectRow
                  key={item.order_item_id}
                  item={item}
                  value={rejected[item.order_item_id]}
                  locked={locked}
                  onChange={(value) => setLine(item.order_item_id, value)}
                />
              ))}
              {allRejected && (
                <p className="pt-2 text-xs text-destructive">Everything turned away? Go back and use “Couldn’t deliver” with “Customer refused order”.</p>
              )}
            </div>
          )}
        </Card>
      )}

      {lines.length > 0 && (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-white p-4 hover:bg-muted">
          <Camera className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-sm font-medium text-foreground">
            {uploadPhoto.isPending ? "Saving photo…" : door?.has_photo ? "Photo saved · tap to retake" : "Photo of the turned-away items"}
            {!door?.has_photo && !uploadPhoto.isPending && <span className="font-normal text-destructive"> (needed)</span>}
          </span>
          <input type="file" accept="image/jpeg,image/png" capture="environment" className="sr-only" disabled={uploadPhoto.isPending} onChange={takePhoto} />
        </label>
      )}

      {payNeeded && (
        <Card className="space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-foreground">Collect payment</p>
            <p className="font-display text-xl font-bold text-foreground">{rupees(qr?.amount ?? due)}</p>
          </div>

          {upiDone ? (
            <p className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">
              <Check className="h-4 w-4" /> Paid by UPI
            </p>
          ) : qr ? (
            <div className="space-y-3 text-center">
              <img src={qr.image_url} alt="UPI QR code" className="mx-auto h-56 w-56 rounded-lg border border-border bg-white object-contain" />
              {timedOut ? (
                <>
                  <p className="text-sm text-muted-foreground">Not paid yet. Make a fresh QR, or take cash instead.</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={doorQr.isPending}
                      onClick={showQr}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-foreground disabled:opacity-60"
                    >
                      <RotateCcw className="h-4 w-4" /> Retry QR
                    </button>
                    <button
                      type="button"
                      disabled={doorQr.isPending}
                      onClick={switchToCash}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-foreground disabled:opacity-60"
                    >
                      <Banknote className="h-4 w-4" /> Switch to cash
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Waiting for the customer to scan and pay…</p>
              )}
            </div>
          ) : method === "CASH" ? (
            <label className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm">
              <input type="checkbox" checked={cashTaken} onChange={(e) => setCashTaken(e.target.checked)} className="h-4 w-4" />
              <span className="flex-1">I’ve collected {rupees(due)} in cash</span>
              <button type="button" onClick={() => setMethod(null)} className="text-xs font-semibold text-primary">
                Change
              </button>
            </label>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMethod("CASH")}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-foreground"
              >
                <Banknote className="h-4 w-4" /> Cash
              </button>
              <button
                type="button"
                disabled={doorQr.isPending || noteMissing || allRejected}
                onClick={showQr}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-foreground disabled:opacity-60"
              >
                <QrCode className="h-4 w-4" /> UPI QR
              </button>
            </div>
          )}
        </Card>
      )}

      <button type="button" onClick={() => notify.notWired("Resending the delivery code")} className="text-sm font-semibold text-primary">
        Customer can’t find the code? Resend by SMS
      </button>

      <button
        type="button"
        disabled={!canComplete}
        onClick={complete}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground"
      >
        <Check className="h-4 w-4" /> Complete delivery
      </button>
      <SavingNote phase={job.phase} />
    </MobileShell>
  );
};

export default Confirm;
