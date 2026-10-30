import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { AlertTriangle, Check, Phone, Truck, X } from "lucide-react";
import { useInspectReturns, useReceiveReturn, useReviewReturn, useStoreReturns } from "../../hooks/use-store";
import { CUSTOMER_RETURN_REASONS, DOOR_REJECT_REASONS, RETURN_REJECT_REASONS, rupees } from "../../lib/assignmentStatus";
import StoreApi from "../../apis/storeApi";
import StorePage, { BTN, CARD } from "../../components/store/StorePage";
import { DoorPhoto, ReturnPhoto, SplitStepper } from "../../components/store/ReturnBits";
import { AssignRiderSection } from "./StoreOrderDetail";

const time = (date) => (date ? new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "");
const REASON_LABEL = Object.fromEntries([...DOOR_REJECT_REASONS, ...CUSTOMER_RETURN_REASONS].map((r) => [r.code, r.label]));
const errorText = (error, fallback) => error?.response?.data?.message || fallback;
const itemName = (row) => [row.item?.product_name, row.item?.variant_name].filter(Boolean).join(" · ") || "Item";

// Wrong item: which variant actually went out (optional). Its stock is taken and the ordered one's put back.
const SentVariantPicker = ({ value, onChange }) => {
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState([]);
  const find = () => search.trim() && StoreApi.searchVariants(search.trim()).then((res) => setOptions(res.data?.rows || []), () => setOptions([]));

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold">What was sent instead? (optional)</span>
      <div className="flex gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && find()} placeholder="Product name"
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm" />
        <button type="button" onClick={find} className="h-9 rounded-lg border border-border px-3 text-[13px] font-bold">Find</button>
      </div>
      {options.length > 0 && (
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
          <option value="">Not sure</option>
          {options.map((v) => (
            <option key={v.id} value={v.id}>{v.product?.name} · #{v.id}</option>
          ))}
        </select>
      )}
    </div>
  );
};

// A customer's return request: approve (with a rider pickup or without), or reject with an internal reason.
// Also on the admin Returns page (orderPath "/admin/orders").
export const ReviewCard = ({ row, orderPath = "/store/orders" }) => {
  const { mutate: review, isPending, error } = useReviewReturn();
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [sentVariant, setSentVariant] = useState(null);
  const send = (body) => review({ orderId: row.order_id, returnId: row.id, body });
  const approve = (pickup) => send({ decision: "APPROVE", pickup, ...(sentVariant ? { sent_variant_id: sentVariant } : {}) });

  return (
    <section className={`${CARD} flex flex-col gap-3 p-4`}>
      <div className="flex items-center justify-between gap-2">
        <Link to={`${orderPath}/${row.order_id}`} className="font-display text-base font-bold">
          Order #{row.order?.order_number || row.order_id}
        </Link>
        <span className="text-xs text-muted-foreground">asked {time(row.created_at)}</span>
      </div>
      <span className="text-sm font-semibold">
        {itemName(row)} × {Number(row.quantity)} · {rupees(row.refund_amount)}
      </span>
      <span className="text-xs text-muted-foreground">
        {REASON_LABEL[row.reason] || row.reason}
        {row.note ? ` · ${row.note}` : ""}
      </span>
      <ReturnPhoto orderId={row.order_id} returnId={row.id} />
      {row.reason === "WRONG_ITEM" && <SentVariantPicker value={sentVariant} onChange={setSentVariant} />}
      {rejecting ? (
        <div className="flex flex-col gap-2">
          <select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} aria-label="Why it's rejected"
            className="h-10 rounded-lg border border-border bg-background px-2 text-sm">
            <option value="">Why? (the customer won't see this)</option>
            {RETURN_REJECT_REASONS.map((r) => (
              <option key={r.code} value={r.code}>{r.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button type="button" onClick={() => setRejecting(false)} className={`${BTN.secondary} flex-1`}>Back</button>
            <button type="button" disabled={!rejectReason || isPending} onClick={() => send({ decision: "REJECT", reject_reason: rejectReason })}
              className={`${BTN.danger} flex-1`}>
              <X className="h-[18px] w-[18px]" /> Reject
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button type="button" disabled={isPending} onClick={() => approve(true)} className={BTN.primary}>
            <Truck className="h-[18px] w-[18px]" /> Approve, send a rider
          </button>
          <div className="flex gap-2">
            <button type="button" disabled={isPending} onClick={() => approve(false)} className={`${BTN.secondary} flex-1`}>
              Approve, no pickup
            </button>
            <button type="button" disabled={isPending} onClick={() => setRejecting(true)} className={`${BTN.secondary} flex-1`}>
              Reject
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs font-semibold text-[#B42318]">{errorText(error, "Couldn't save the decision.")}</p>}
    </section>
  );
};

// A rider at the counter with goods owed back: the store types the code from the rider's app.
const ComingBackCard = ({ row }) => {
  const { mutate: receive, isPending, error } = useReceiveReturn();
  const [code, setCode] = useState("");

  return (
    <section className={`${CARD} flex flex-col gap-3 p-4 ${row.overdue ? "border-[#B42318]/40" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <Link to={`/store/orders/${row.order_id}`} className="font-display text-base font-bold">
          Order #{row.order_id}
        </Link>
        <span
          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
            row.overdue ? "bg-[#FDECEA] text-[#B42318]" : "bg-[#FEF4D6] text-[#7A5500]"
          }`}
        >
          {row.overdue ? "Overdue" : { DOORSTEP: "Turned away at door", CUSTOMER: "Customer return" }[row.kind] || "Not delivered"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[15px] font-bold">{row.partner?.name || "Rider"}</span>
          <span className="text-xs text-muted-foreground">
            {{ DOORSTEP: "Some items turned away", CUSTOMER: "Collected from the customer" }[row.kind] || "Whole order"} · since {time(row.due_since)}
          </span>
        </span>
        {row.partner?.phone && (
          <a href={`tel:${row.partner.phone}`} aria-label="Call the rider" className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Phone className="h-4 w-4" />
          </a>
        )}
      </div>
      {row.has_door_photo && <DoorPhoto assignmentId={row.assignment_id} />}
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        autoComplete="off"
        placeholder="Rider's return code"
        aria-label={`Return code for order ${row.order_id}`}
        className="h-11 rounded-lg border border-border bg-background px-3 text-center font-display text-lg font-bold tracking-[0.3em] placeholder:text-sm placeholder:font-normal placeholder:tracking-normal"
      />
      <button
        type="button"
        disabled={code.length !== 4 || isPending}
        onClick={() => receive({ assignmentId: row.assignment_id, returnCode: code, orderId: row.order_id })}
        className={BTN.primary}
      >
        <Check className="h-[18px] w-[18px]" /> {isPending ? "Saving…" : "Goods received"}
      </button>
      {error && <p className="text-xs font-semibold text-[#B42318]">{errorText(error, "Couldn't record the return.")}</p>}
    </section>
  );
};

// Turned-away lines of one order, back in the store: each split into shelf and write-off (write-off unless changed),
// which also sends the refund for a prepaid order.
const InspectCard = ({ orderId, rows }) => {
  const { mutate: inspect, isPending, error } = useInspectReturns();
  const [restock, setRestock] = useState({});
  const order = rows[0].order;
  const door = rows.find((row) => row.source !== "CUSTOMER");

  const submit = () =>
    inspect({
      orderId,
      items: rows.map((row) => {
        const qty = Number(row.quantity);
        const back = restock[row.id] ?? 0;
        return { return_id: row.id, restock_qty: back, write_off_qty: qty - back };
      }),
    });

  return (
    <section className={`${CARD} flex flex-col gap-3 p-4`}>
      <div className="flex items-center justify-between gap-2">
        <Link to={`/store/orders/${orderId}`} className="font-display text-base font-bold">
          Order #{order?.order_number || orderId}
        </Link>
        <span className="text-xs text-muted-foreground">{door ? "Turned away at the door" : "Customer return"}</span>
      </div>
      {door?.assignment_id && <DoorPhoto assignmentId={door.assignment_id} />}
      <ul className="flex flex-col gap-3">
        {rows.map((row) => {
          const name = itemName(row);
          return (
            <li key={row.id} className="flex flex-col gap-1.5 border-t border-border pt-3 first:border-0 first:pt-0">
              <span className="text-sm font-semibold">
                {name} × {Number(row.quantity)}
              </span>
              <span className="text-xs text-muted-foreground">
                {REASON_LABEL[row.reason] || row.reason}
                {row.note ? ` · ${row.note}` : ""}
              </span>
              <SplitStepper label={name} total={Number(row.quantity)} restock={restock[row.id] ?? 0} onChange={(n) => setRestock((s) => ({ ...s, [row.id]: n }))} />
            </li>
          );
        })}
      </ul>
      <button type="button" disabled={isPending} onClick={submit} className={BTN.primary}>
        <Check className="h-[18px] w-[18px]" /> {isPending ? "Saving…" : "Checked"}
      </button>
      {error && <p className="text-xs font-semibold text-[#B42318]">{errorText(error, "Couldn't save the check.")}</p>}
    </section>
  );
};

const Section = ({ title, hint, children }) => (
  <section className="flex flex-col gap-3">
    <div>
      <h2 className="text-[15px] lg:text-base">{title}</h2>
      {hint && <p className="text-[13px] text-muted-foreground">{hint}</p>}
    </div>
    {children}
  </section>
);

const GRID = "grid grid-cols-1 gap-3 md:grid-cols-2 lg:gap-4 xl:grid-cols-3";

const StoreReturns = () => {
  const { staff } = useOutletContext();
  const { due, received, toReview, toPickUp, backInStore, isLoading } = useStoreReturns(staff?.warehouse_id);

  const groupByOrder = (rows) =>
    rows.reduce((groups, row) => {
      (groups[row.order_id] ||= []).push(row);
      return groups;
    }, {});
  const byOrder = groupByOrder(received);
  const pickups = Object.values(groupByOrder(toPickUp));
  const overdue = due.filter((row) => row.overdue).length;

  return (
    <StorePage title="Returns" subtitle="Customer return requests, goods coming back from riders, and what to check before it goes back on the shelf">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          {overdue > 0 && (
            <p className="flex items-center gap-2.5 rounded-xl bg-[#FDECEA] px-3 py-2.5 text-[13px] text-[#B42318]">
              <AlertTriangle className="h-[18px] w-[18px] shrink-0" />
              {overdue} rider{overdue > 1 ? "s have" : " has"} had goods for over 2 hours. Call them.
            </p>
          )}

          <Section title="To review" hint="Customers asking to return items. Approve with a rider pickup, without one (refund now), or reject.">
            {toReview.length === 0 ? (
              <p className={`${CARD} p-5 text-sm text-muted-foreground`}>No return requests.</p>
            ) : (
              <div className={GRID}>
                {toReview.map((row) => (
                  <ReviewCard key={row.id} row={row} />
                ))}
              </div>
            )}
          </Section>

          {pickups.length > 0 && (
            <Section title="To pick up" hint="Approved returns to collect from the customer. Pick a rider.">
              <div className={GRID}>
                {pickups.map((rows) =>
                  rows.some((row) => !row.assignment_id) ? (
                    <AssignRiderSection key={rows[0].order_id} order={rows[0].order} pickup className="" />
                  ) : (
                    <p key={rows[0].order_id} className={`${CARD} p-4 text-sm`}>
                      <strong>Order #{rows[0].order?.order_number || rows[0].order_id}</strong>
                      <span className="block text-muted-foreground">A rider is on the way to collect it.</span>
                    </p>
                  )
                )}
              </div>
            </Section>
          )}

          <Section title="Coming back" hint="Riders can't take new orders until they bring these back. Enter the code from their app.">
            {due.length === 0 ? (
              <p className={`${CARD} p-5 text-sm text-muted-foreground`}>Nothing is out with riders.</p>
            ) : (
              <div className={GRID}>
                {due.map((row) => (
                  <ComingBackCard key={row.assignment_id} row={row} />
                ))}
              </div>
            )}
          </Section>

          {backInStore.length > 0 && (
            <Section title="Not delivered, back in store" hint="Send it out again, or cancel it and put the goods away.">
              <ul className={`${CARD} overflow-hidden`}>
                {backInStore.map((order) => (
                  <li key={order.id} className="flex items-center gap-3 border-t border-border px-4 py-3 first:border-0 lg:px-5">
                    <span className="flex min-w-0 flex-1 flex-col text-sm">
                      <strong>#{order.order_number || order.id}</strong>
                      <span className="text-muted-foreground">{order.items?.length || 0} items · back {time(order.updated_at)}</span>
                    </span>
                    <Link to={`/store/orders/${order.id}`} className="text-[13px] font-bold text-primary">
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="To check" hint="Back in the store. Count what can go back on the shelf; the rest is written off.">
            {Object.keys(byOrder).length === 0 ? (
              <p className={`${CARD} p-5 text-sm text-muted-foreground`}>Nothing waiting to be checked.</p>
            ) : (
              <div className={GRID}>
                {Object.entries(byOrder).map(([orderId, rows]) => (
                  <InspectCard key={orderId} orderId={orderId} rows={rows} />
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </StorePage>
  );
};

export default StoreReturns;
