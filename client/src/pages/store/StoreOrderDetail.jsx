import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Check, X, Info, PackageCheck, Bike, ArrowRightLeft, RotateCcw, Undo2 } from "lucide-react";
import StageBadge from "../../components/store/StageBadge";
import StorePage, { BTN, CARD } from "../../components/store/StorePage";
import { DoorPhoto, SplitStepper } from "../../components/store/ReturnBits";
import { deriveStage, STAGE_STYLES } from "../../lib/orderStage";
import {
  useStoreOrder,
  useUpdateItemStatus,
  useFinalizeItems,
  usePackOrder,
  useAvailableRiders,
  useAssignRider,
  useAssignPickup,
  useStoreAssignment,
  useCancelReturned,
} from "../../hooks/use-store";

const HANDED = ["PICKED_UP", "OUT_FOR_DELIVERY"];
const STEPS = ["Picked", "Confirmed", "Packed", "Rider", "Handed"];
const STEPS_DONE = { NEW: 0, PICKING: 0, WAITING: 1, PACKING: 2, READY: 3, ASSIGNED: 4 };
const REASONS = ["Out of stock", "Not fresh / damaged", "Less quantity than ordered"];
const ITEM_CHIP = {
  READY: ["Picked", "bg-[#E3F1E8] text-[#166434]"],
  NOT_AVAILABLE: ["Not available", "bg-[#FDECEA] text-[#B42318]"],
  PENDING: ["To pick", "bg-[#ECEFF1] text-muted-foreground"],
};
const RETURN_STATUS_TEXT = {
  REQUESTED: "Customer asked · to review",
  APPROVED: "Approved · to pick up",
  REJECTED: "Rejected",
  IN_TRANSIT: "With the rider",
  RECEIVED: "Back, to check",
  CLOSED: "Checked",
};
const ROW_TINT ={ READY: "bg-[#F3F9F5]", NOT_AVAILABLE: "bg-[#FDF3F2]", PENDING: "bg-card" };
// Web item grid: item · qty · price · status · note/actions. Phones show item + one side cell.
const ITEM_GRID = "lg:grid-cols-[minmax(0,2fr)_56px_72px_120px_minmax(0,1.8fr)]";
const INPUT = "h-11 rounded-xl border-[1.5px] border-border bg-card px-3 text-[15px] font-normal outline-none focus:border-primary";

const time = (date) => (date ? new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "");
const rupees = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;
const humanize = (status = "") => status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
const names = (items) => items.map((item) => item.product_name).join(", ");

const Stepper = ({ done }) => (
  <ol aria-label="Order progress" className="flex gap-1">
    {STEPS.map((label, index) => (
      <li key={label} aria-current={index === done ? "step" : undefined} className="flex flex-1 flex-col gap-1.5">
        <span className={`h-1 rounded ${index < done ? "bg-primary" : index === done ? "bg-[#FBBD23]" : "bg-[#E2E6E4]"}`} />
        <span
          className={`text-[11px] ${
            index < done ? "font-semibold text-primary" : index === done ? "font-bold text-foreground" : "font-medium text-muted-foreground"
          }`}
        >
          {label}
        </span>
      </li>
    ))}
  </ol>
);

const ItemChip = ({ status }) => {
  const [label, tone] = ITEM_CHIP[status] || ITEM_CHIP.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};

const ItemRow = ({ item, orderId, editable }) => {
  const status = item.status || "PENDING";
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [remark, setRemark] = useState("");
  const { mutate: updateItem, isPending } = useUpdateItemStatus();
  const price = item.line_total ?? Number(item.selling_price || 0) * item.quantity;

  const save = (next, adminRemarks) =>
    updateItem({ orderId, itemId: item.id, status: next, admin_remarks: adminRemarks }, { onSuccess: () => setReasonOpen(false) });

  const toggleButton = (on, tone) =>
    `flex h-12 w-12 items-center justify-center rounded-xl border-[1.5px] transition-colors disabled:opacity-50 lg:h-9 lg:w-auto lg:rounded-lg lg:border lg:px-3 lg:text-[13px] lg:font-semibold ${
      on ? `${tone.on} text-white` : `border-border bg-card ${tone.off} lg:text-muted-foreground`
    }`;

  return (
    <li
      className={
        editable
          ? `rounded-2xl border border-border p-3 lg:rounded-none lg:border-x-0 lg:border-b-0 lg:px-5 ${ROW_TINT[status]}`
          : "border-t border-border py-2.5 first:border-t-0 lg:px-5 lg:py-3 lg:first:border-t"
      }
    >
      <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 ${ITEM_GRID}`}>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className={`text-foreground ${editable ? "text-[15px] font-bold" : "text-sm font-semibold"} lg:text-sm lg:font-semibold`}>
            {item.product_name}
          </span>
          <span className="text-[13px] text-muted-foreground">
            {item.variant_name}
            <span className="lg:hidden">
              {" "}× <strong className="text-foreground">{item.quantity}</strong> · {rupees(price)}
            </span>
          </span>
          {!editable && item.admin_remarks && <span className="text-xs text-[#B42318] lg:hidden">{item.admin_remarks}</span>}
        </div>
        <span className="hidden text-sm text-muted-foreground lg:block">× {item.quantity}</span>
        <span className="hidden text-sm lg:block">{rupees(price)}</span>
        <span className={editable ? "hidden lg:block" : ""}>
          <ItemChip status={status} />
        </span>
        {editable ? (
          <div className="flex justify-end gap-2 lg:justify-start">
            <button
              type="button"
              aria-label={`${item.product_name} not available`}
              aria-pressed={status === "NOT_AVAILABLE"}
              disabled={isPending}
              onClick={() => setReasonOpen((open) => !open)}
              className={`${toggleButton(status === "NOT_AVAILABLE", { on: "border-[#B42318] bg-[#B42318]", off: "text-[#B42318]" })} lg:order-last`}
            >
              <X className="h-5 w-5 lg:hidden" />
              <span className="hidden lg:inline">Not available</span>
            </button>
            <button
              type="button"
              aria-label={`Picked ${item.product_name}`}
              aria-pressed={status === "READY"}
              disabled={isPending}
              onClick={() => save("READY")}
              className={toggleButton(status === "READY", { on: "border-primary bg-primary", off: "text-primary" })}
            >
              <Check className="h-5 w-5 lg:hidden" />
              <span className="hidden lg:inline">Picked</span>
            </button>
          </div>
        ) : (
          <span className="hidden truncate text-sm text-muted-foreground lg:block">{item.admin_remarks || "—"}</span>
        )}
      </div>

      {editable && status === "NOT_AVAILABLE" && !reasonOpen && item.admin_remarks && (
        <p className="mt-1.5 text-xs text-[#B42318] lg:mt-1">{item.admin_remarks}</p>
      )}

      {reasonOpen && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save("NOT_AVAILABLE", remark.trim() ? `${reason} · ${remark.trim()}` : reason);
          }}
          className="mt-3 flex flex-col gap-3 rounded-xl border border-[#B42318]/30 bg-card p-3 lg:flex-row lg:flex-wrap lg:items-end"
        >
          <fieldset className="flex flex-wrap gap-2 lg:basis-full">
            <legend className="mb-2 text-sm font-semibold text-foreground">Why can't you pack it?</legend>
            {REASONS.map((option) => (
              <label
                key={option}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-[1.5px] px-3 text-sm font-medium ${
                  reason === option ? "border-[#B42318] bg-[#FDECEA]" : "border-border bg-card"
                }`}
              >
                <input
                  type="radio"
                  name={`reason-${item.id}`}
                  checked={reason === option}
                  onChange={() => setReason(option)}
                  className="h-4 w-4 accent-[#B42318]"
                />
                {option}
              </label>
            ))}
          </fieldset>
          <label className="flex flex-1 flex-col gap-1.5 text-sm font-semibold text-foreground">
            Remark (customer sees this)
            <input value={remark} onChange={(event) => setRemark(event.target.value)} className={INPUT} />
          </label>
          <button type="submit" disabled={isPending} className={BTN.danger}>
            Mark not available
          </button>
          <p className="text-xs leading-relaxed text-muted-foreground lg:basis-full">
            The customer is asked to accept the rest of the order. If they do, {rupees(price)} is refunded.
          </p>
        </form>
      )}
    </li>
  );
};

const PickFooter = ({ order }) => {
  const items = order.items || [];
  const left = items.filter((item) => (item.status || "PENDING") === "PENDING").length;
  const anyMissing = items.some((item) => item.status === "NOT_AVAILABLE");
  const { mutate: finalize, isPending, error } = useFinalizeItems();
  return (
    <>
      <p className="hidden flex-1 text-xs text-muted-foreground lg:block">
        Mark every item, then finalize. All picked → <strong>packing</strong>. Some missing → customer is asked first.
      </p>
      {error && <p className="text-xs font-semibold text-[#B42318]">{error.response?.data?.message || "Couldn't finalize."}</p>}
      <button type="button" disabled={left > 0 || isPending} onClick={() => finalize(order.id)} className={BTN.primary}>
        {left > 0 ? `Mark every item to continue (${left} left)` : anyMissing ? "Finalize · ask customer" : "Finalize · start packing"}
      </button>
    </>
  );
};

const ItemsCard = ({ order, editable, footer }) => {
  const items = order.items || [];
  const picked = items.filter((item) => item.status === "READY").length;
  const missing = items.filter((item) => item.status === "NOT_AVAILABLE").length;
  const left = items.length - picked - missing;
  const summary = [picked && `${picked} picked`, missing && `${missing} not available`, left && `${left} to pick`].filter(Boolean).join(" · ");

  return (
    // overflow-clip, not hidden: hidden would stop the footer from sticking on phones.
    <section className={`${CARD} order-5 overflow-clip`}>
      <div className="flex flex-col gap-2 px-4 py-3.5 lg:px-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] lg:text-base">Items</h2>
          <span className="text-[13px] text-muted-foreground">{summary}</span>
        </div>
        {editable && items.length > 0 && (
          <span className="flex h-1.5 rounded-md bg-muted">
            <span className="block rounded-md bg-primary transition-all" style={{ width: `${((picked + missing) * 100) / items.length}%` }} />
          </span>
        )}
      </div>
      <div aria-hidden="true" className={`hidden gap-x-3 bg-muted px-5 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid ${ITEM_GRID}`}>
        <span>Item</span>
        <span>Qty</span>
        <span>Price</span>
        <span>Status</span>
        <span>{editable ? "" : "Note"}</span>
      </div>
      <ul className={editable ? "flex flex-col gap-2 px-3 pb-3 lg:gap-0 lg:p-0" : "px-4 lg:px-0"}>
        {items.map((item) => (
          <ItemRow key={item.id} item={item} orderId={order.id} editable={editable} />
        ))}
      </ul>
      {footer && (
        <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t border-border bg-card p-4 lg:static lg:flex-row lg:items-center lg:justify-end lg:gap-3 lg:bg-muted lg:px-5">
          {footer}
        </div>
      )}
    </section>
  );
};

const PackSection = ({ order }) => {
  const [bagCount, setBagCount] = useState(order.bag_count || 1);
  const [rackLabel, setRackLabel] = useState(order.rack_label || "");
  const { mutate: pack, isPending, error } = usePackOrder();
  const packing = (order.items || []).filter((item) => item.status !== "NOT_AVAILABLE");
  const stepButton = "h-12 w-12 rounded-[14px] border-[1.5px] border-border bg-card text-2xl font-bold text-foreground disabled:opacity-40";

  return (
    <section className={`${CARD} order-3 flex flex-col gap-4 p-4 lg:p-5`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-[15px] lg:text-base">Bags</h2>
          <div className="flex items-center justify-center gap-4 sm:justify-start">
            <button type="button" aria-label="Fewer bags" disabled={bagCount <= 1} onClick={() => setBagCount((n) => n - 1)} className={stepButton}>
              −
            </button>
            <span className="min-w-12 text-center font-display text-4xl font-bold">{bagCount}</span>
            <button type="button" aria-label="More bags" disabled={bagCount >= 9} onClick={() => setBagCount((n) => n + 1)} className={stepButton}>
              +
            </button>
          </div>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground sm:w-48">
          Rack
          <input value={rackLabel} onChange={(event) => setRackLabel(event.target.value)} placeholder="e.g. B-4" maxLength={20} className={INPUT} />
        </label>
      </div>
      <div className="flex items-center gap-3.5 rounded-xl border-2 border-dashed border-foreground px-3.5 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-display text-2xl font-bold tracking-wide">#{order.order_number || order.id}</span>
          <span className="truncate text-[13px] text-muted-foreground">
            {[order.address?.full_name, `${packing.length} items`, `${bagCount} ${bagCount === 1 ? "bag" : "bags"}`].filter(Boolean).join(" · ")}
          </span>
        </div>
        {rackLabel && <span className="rounded-[10px] bg-foreground px-3 py-2 font-display text-lg font-bold text-background">{rackLabel}</span>}
      </div>
      <button type="button" disabled={isPending} onClick={() => pack({ orderId: order.id, bagCount, rackLabel })} className={BTN.primary}>
        <PackageCheck className="h-5 w-5" /> Mark packed
      </button>
      {error && <p className="text-xs font-semibold text-[#B42318]">{error.response?.data?.message || "Couldn't save the packing."}</p>}
    </section>
  );
};

// `pickup`: send the rider to collect the order's approved customer returns instead (the Returns page).
export const AssignRiderSection = ({ order, pickup = false, className = "order-4" }) => {
  const [selected, setSelected] = useState(null);
  const { riders, isLoading } = useAvailableRiders(order.warehouse_id);
  const assignDelivery = useAssignRider();
  const assignPickup = useAssignPickup();
  const { mutate: assign, isPending, error } = pickup ? assignPickup : assignDelivery;
  const chosen = riders.find((rider) => rider.id === selected);

  return (
    <section className={`${CARD} ${className} flex flex-col gap-2.5 p-4 lg:p-5`}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[15px] lg:text-base">{pickup ? `Pick up · Order #${order.order_number || order.id}` : "Assign rider"}</h2>
        <span className="text-[13px] text-muted-foreground">Nearest first</span>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading nearby riders…</p>
      ) : riders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No delivery partners online right now.</p>
      ) : (
        riders.map((rider) => (
          <label
            key={rider.id}
            className={`flex min-h-[60px] cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] px-3.5 ${
              selected === rider.id ? "border-primary bg-[#E3F1E8]" : "border-border bg-card"
            }`}
          >
            <input type="radio" name="rider" checked={selected === rider.id} onChange={() => setSelected(rider.id)} className="h-5 w-5 accent-primary" />
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-[13px] font-bold">
              {(rider.name || "R").slice(0, 2).toUpperCase()}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-bold">{rider.name}</span>
              {rider.meta && <span className="text-xs text-muted-foreground">{rider.meta}</span>}
            </span>
          </label>
        ))
      )}
      <button
        type="button"
        disabled={!selected || isPending}
        onClick={() => assign({ orderId: order.id, deliveryPartnerId: selected })}
        className={`${BTN.primary} mt-1`}
      >
        <Bike className="h-5 w-5" /> {chosen ? `Assign ${chosen.name}` : "Assign rider"}
      </button>
      {error && <p className="text-xs font-semibold text-[#B42318]">{error.response?.data?.message || "Couldn't assign the rider."}</p>}
    </section>
  );
};

// ponytail: a checklist for the shelf walk only; nothing is saved, so it resets on reload.
// Persist it when the backend tracks returned stock.
const PutBackSection = ({ items }) => {
  const navigate = useNavigate();
  const [back, setBack] = useState({});
  const done = items.filter((item) => back[item.id]).length;

  return (
    <section className={`${CARD} order-5 flex flex-col gap-3 p-4 lg:p-5`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[15px] lg:text-base">Put back on shelf</h2>
        <span className="text-[13px] text-muted-foreground">
          {done} of {items.length} back on shelf
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <label
            key={item.id}
            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-[1.5px] px-3 ${
              back[item.id] ? "border-primary bg-[#E3F1E8]" : "border-border bg-card"
            }`}
          >
            <input
              type="checkbox"
              checked={!!back[item.id]}
              onChange={() => setBack((state) => ({ ...state, [item.id]: !state[item.id] }))}
              className="h-5 w-5 shrink-0 accent-primary"
            />
            <span className="flex-1 text-sm font-semibold">
              {[item.product_name, item.variant_name].filter(Boolean).join(" · ")}
              {item.quantity > 1 && ` × ${item.quantity}`}
            </span>
          </label>
        ))}
      </div>
      <button type="button" disabled={done < items.length} onClick={() => navigate("/store")} className={BTN.primary}>
        {done < items.length ? `${done} of ${items.length} back on shelf` : "All items back on shelf"}
      </button>
    </section>
  );
};

// DELIVERY_FAILED: the goods are still with the rider. Same rider tries again, or brings them back (Returns page).
const FailedDropSection = ({ order }) => {
  const { assignment } = useStoreAssignment(order.id);
  const { mutate: assign, isPending, error } = useAssignRider();
  if (!assignment) return null;
  const failure = assignment.last_failure;

  return (
    <section className={`${CARD} order-3 flex flex-col gap-3 p-4 lg:p-5`}>
      <h2 className="text-[15px] lg:text-base">Not delivered</h2>
      <p className="text-sm">
        Attempt {assignment.attempts} of {assignment.max_attempts}
        {failure?.reason ? `: ${failure.reason}` : ""}
      </p>
      <p className="text-[13px] text-muted-foreground">{assignment.partner?.name || "The rider"} still has the goods.</p>
      {assignment.can_retry && assignment.partner && (
        <button type="button" disabled={isPending} onClick={() => assign({ orderId: order.id, deliveryPartnerId: assignment.partner.id })} className={BTN.primary}>
          <RotateCcw className="h-5 w-5" /> {isPending ? "Saving…" : `Try again with ${assignment.partner.name}`}
        </button>
      )}
      {!assignment.can_retry && (
        <p className="text-[13px] font-semibold text-[#B42318]">
          {failure?.reason_code === "REFUSED" ? "The customer refused it, so it isn't sent again." : "No attempts left."} The rider has to bring it back.
        </p>
      )}
      <Link to="/store/returns" className={BTN.secondary}>
        <Undo2 className="h-5 w-5" /> Take it back
      </Link>
      {error && <p className="text-xs font-semibold text-[#B42318]">{error.response?.data?.message || "Couldn't send it again."}</p>}
    </section>
  );
};

// RETURNED_TO_STORE: cancel and refund, with each item split into shelf and write-off (all back on the shelf unless
// changed: the goods never reached the customer). Sending it out again is the rider list next to this.
const CancelReturnedSection = ({ order }) => {
  const { mutate: cancel, isPending, error } = useCancelReturned();
  const items = (order.items || []).filter((item) => item.status !== "NOT_AVAILABLE");
  const [restock, setRestock] = useState({});
  const [confirming, setConfirming] = useState(false);
  const back = (item) => restock[item.id] ?? Number(item.quantity);

  const submit = () =>
    cancel({
      orderId: order.id,
      reason: "Not delivered, cancelled after the goods came back",
      items: items.map((item) => ({ order_item_id: Number(item.id), restock_qty: back(item), write_off_qty: Number(item.quantity) - back(item) })),
    });

  return (
    <section className={`${CARD} order-3 flex flex-col gap-3 p-4 lg:p-5`}>
      <h2 className="text-[15px] lg:text-base">Cancel and put away</h2>
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const name = [item.product_name, item.variant_name].filter(Boolean).join(" · ");
          return (
            <li key={item.id} className="flex flex-col gap-1.5 border-t border-border pt-3 first:border-0 first:pt-0">
              <span className="text-sm font-semibold">
                {name} × {Number(item.quantity)}
              </span>
              <SplitStepper label={name} total={Number(item.quantity)} restock={back(item)} onChange={(n) => setRestock((s) => ({ ...s, [item.id]: n }))} />
            </li>
          );
        })}
      </ul>
      {confirming ? (
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={() => setConfirming(false)} className={BTN.secondary}>
            Keep it
          </button>
          <button type="button" disabled={isPending} onClick={submit} className={BTN.danger}>
            {isPending ? "Cancelling…" : "Cancel order"}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className={BTN.secondary}>
          <X className="h-5 w-5" /> Cancel and refund
        </button>
      )}
      {error && <p className="text-xs font-semibold text-[#B42318]">{error.response?.data?.message || "Couldn't cancel the order."}</p>}
    </section>
  );
};

// What the customer turned away at the door, on a delivered order.
const DoorReturnsSection = ({ order }) => (
  <section className={`${CARD} order-5 flex flex-col gap-3 p-4 lg:p-5`}>
    <h2 className="text-[15px] lg:text-base">Turned away at the door</h2>
    <ul className="flex flex-col gap-2 text-sm">
      {order.returns.map((row) => {
        const item = (order.items || []).find((i) => String(i.id) === String(row.order_item_id));
        return (
          <li key={row.id} className="flex flex-wrap justify-between gap-2">
            <span>
              <span className="font-semibold">{item?.product_name ?? "Item"}</span> × {Number(row.quantity)}
            </span>
            <span className="text-muted-foreground">{RETURN_STATUS_TEXT[row.status]}</span>
          </li>
        );
      })}
    </ul>
    {order.returns[0]?.assignment_id && <DoorPhoto assignmentId={order.returns[0].assignment_id} />}
  </section>
);

const banner = (stage, order, handed) => {
  const items = order.items || [];
  const missing = items.filter((item) => item.status === "NOT_AVAILABLE");
  const picked = items.filter((item) => item.status === "READY");
  if (handed) return ["Handed to rider", "The order has left the store. Delivery is tracked in the rider app."];
  switch (stage) {
    case "NEW":
      return ["Waiting for a picker", "Nobody has started this order yet. Mark items as you pick them."];
    case "PICKING":
      return ["Picking in progress", `${items.length - picked.length - missing.length} of ${items.length} items still to check.`];
    case "WAITING":
      return [
        "Waiting for the customer",
        `${names(missing)} ${missing.length === 1 ? "isn't" : "aren't"} available. The customer was asked to accept the rest of the order. Keep the picked items aside and don't pack until they reply.`,
      ];
    case "PACKING":
      return missing.length
        ? [`Don't pack ${names(missing)}`, "The customer accepted the order without it."]
        : [`All ${items.length} items available`, "Pack the order, then mark it packed."];
    case "READY":
      return ["Packed · ready for pickup", "Assign a rider to collect it."];
    case "ASSIGNED":
      return ["Rider assigned", "Match the rider's pickup code and the bag label, then hand over."];
    case "RETURN":
      return order.status === "RETURNED_TO_STORE"
        ? ["Back in the store", "The rider brought it back. Send it out again, or cancel it and put the goods away."]
        : ["Not delivered", "The rider still has the goods. Send it again, or have them bring it back."];
    case "CANCELLED":
      if (order.returns?.length) return ["Order cancelled", "It came back from delivery and the goods were put away or written off."];
      return picked.length
        ? ["Order cancelled", "Put the picked items back on their shelves."]
        : ["Order cancelled", "Nothing was picked, so there's nothing to put back."];
    default:
      return null;
  }
};

const StoreOrderDetail = () => {
  const { orderId } = useParams();
  const { order, isLoading } = useStoreOrder(orderId);

  if (isLoading || !order) {
    return (
      <StorePage title="Order" back="/store">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </StorePage>
    );
  }

  const stage = deriveStage(order);
  const handed = HANDED.includes(order.status);
  const items = order.items || [];
  const pickedItems = items.filter((item) => item.status === "READY");
  const [title, text] = banner(stage, order, handed) || [];
  const footer = {
    NEW: <PickFooter order={order} />,
    PICKING: <PickFooter order={order} />,
    WAITING: (
      <>
        <p className="hidden flex-1 text-xs text-muted-foreground lg:block">Items are locked until the customer replies.</p>
        <button type="button" disabled className={BTN.primary}>
          Waiting for customer
        </button>
      </>
    ),
    ASSIGNED: handed ? (
      <Link to="/store" className={BTN.secondary}>
        Back to orders
      </Link>
    ) : (
      <Link to="/store/handover" className={BTN.primary}>
        <ArrowRightLeft className="h-5 w-5" /> Hand over to rider
      </Link>
    ),
  }[stage];

  return (
    <StorePage
      title={`Order #${order.order_number || order.id}`}
      subtitle={[`Placed ${time(order.placed_at || order.created_at)}`, order.address?.full_name, rupees(order.total_amount)].filter(Boolean).join(" · ")}
      back="/store"
      badge={<StageBadge stage={stage} />}
    >
      {/* Phones: one column, sections ordered by order-*. Web: main column + aside.
          The wrappers are display:contents on phones so their children share one flex order. */}
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-5">
        <div className="contents lg:flex lg:flex-col lg:gap-5">
          {stage !== "CANCELLED" && stage !== "RETURN" && (
            <section className="order-1 lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:px-5 lg:py-4">
              <Stepper done={handed ? 5 : STEPS_DONE[stage] ?? 0} />
            </section>
          )}
          {title && (
            <section role="status" className={`order-2 flex gap-3 rounded-[14px] px-4 py-3.5 ${STAGE_STYLES[handed ? "READY" : stage] || ""}`}>
              <Info className="mt-0.5 h-5 w-5 shrink-0" />
              <span className="flex flex-col gap-1">
                <span className="text-[15px] font-bold">{title}</span>
                <span className="text-[13px] leading-relaxed text-foreground">{text}</span>
              </span>
            </section>
          )}
          {stage === "PACKING" && <PackSection order={order} />}
          {order.status === "DELIVERY_FAILED" && <FailedDropSection order={order} />}
          {order.status === "RETURNED_TO_STORE" && <CancelReturnedSection order={order} />}
          {order.status === "DELIVERED" && order.returns?.length > 0 && <DoorReturnsSection order={order} />}
          {/* With return rows the stock was already put away (or written off) when it was cancelled. */}
          {stage === "CANCELLED" && pickedItems.length > 0 && !order.returns?.length ? (
            <PutBackSection items={pickedItems} />
          ) : (
            <ItemsCard order={order} editable={stage === "NEW" || stage === "PICKING"} footer={footer} />
          )}
        </div>

        <aside className="contents lg:flex lg:flex-col lg:gap-5">
          {(stage === "READY" || order.status === "RETURNED_TO_STORE") && <AssignRiderSection order={order} />}
          <section className={`${CARD} order-6 flex flex-col gap-1.5 p-4 lg:p-5`}>
            <h2 className="mb-1 text-[15px] lg:text-base">Customer</h2>
            <span className="text-sm font-semibold">{order.address?.full_name}</span>
            <span className="text-sm text-muted-foreground">
              {[order.address?.address_line_1, order.address?.address_line_2, order.address?.landmark, order.address?.city, order.address?.postal_code]
                .filter(Boolean)
                .join(", ")}
            </span>
          </section>
          {order.statusHistory?.length > 0 && (
            <section className={`${CARD} order-7 flex flex-col gap-3 p-4 lg:p-5`}>
              <h2 className="text-[15px] lg:text-base">Timeline</h2>
              <ol className="flex flex-col">
                {order.statusHistory.map((entry, index, all) => {
                  const last = index === all.length - 1;
                  return (
                    <li key={index} className="flex gap-3">
                      <span className="flex flex-col items-center">
                        <span className={`mt-1 h-3 w-3 rounded-full ${last ? "bg-[#FBBD23]" : "bg-primary"}`} />
                        {!last && <span className="w-0.5 flex-1 bg-border" />}
                      </span>
                      <span className={`flex flex-col gap-0.5 ${last ? "" : "pb-3.5"}`}>
                        <span className={`text-sm text-foreground ${last ? "font-bold" : "font-semibold"}`}>{humanize(entry.new_status)}</span>
                        <span className="text-xs text-muted-foreground">{time(entry.created_at)}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </aside>
      </div>
    </StorePage>
  );
};

export default StoreOrderDetail;
