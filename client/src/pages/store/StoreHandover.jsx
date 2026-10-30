import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Check, AlertCircle } from "lucide-react";
import { useStoreHandovers, useConfirmHandover, useStoreQueue } from "../../hooks/use-store";
import { deriveStage } from "../../lib/orderStage";
import StorePage, { BTN, CARD } from "../../components/store/StorePage";

const time = (date) => (date ? new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "");

// The rider's app shows a 4-digit pickup code; staff type it in and the server checks it before PICKED_UP.
const HandoverCard = ({ order }) => {
  const { mutate: confirm, isPending, error } = useConfirmHandover();
  const [code, setCode] = useState("");

  return (
    <section className={`${CARD} flex flex-col gap-3 p-4`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-base font-bold">Order #{order.order_number || order.id}</span>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#E6EEF9] px-2.5 py-1 text-xs font-semibold text-[#1E4F91]">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          Rider assigned
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E3F1E8] text-[13px] font-bold text-primary">
          {(order.rider_name || "R").slice(0, 2).toUpperCase()}
        </span>
        <span className="text-[15px] font-bold">{order.rider_name || "Rider"}</span>
      </div>
      <div className="flex gap-2.5 text-[13px] font-semibold">
        {order.bag_count > 0 && <span className="rounded-lg bg-muted px-2.5 py-1.5">{order.bag_count} bags</span>}
        <span className="rounded-lg bg-muted px-2.5 py-1.5">{order.rack_label ? `Rack ${order.rack_label}` : "No rack set"}</span>
      </div>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        autoComplete="off"
        placeholder="Rider's pickup code"
        aria-label={`Pickup code for order ${order.order_number || order.id}`}
        className="h-11 rounded-lg border border-border bg-background px-3 text-center font-display text-lg font-bold tracking-[0.3em] placeholder:text-sm placeholder:font-normal placeholder:tracking-normal"
      />
      <button
        type="button"
        disabled={!order.assignment_id || code.length !== 4 || isPending}
        onClick={() => confirm({ assignmentId: order.assignment_id, pickupCode: code })}
        className={BTN.primary}
      >
        <Check className="h-[18px] w-[18px]" /> {isPending ? "Saving…" : "Handed over"}
      </button>
      {error && <p className="text-xs font-semibold text-[#B42318]">{error.response?.data?.message || "Couldn't confirm handover."}</p>}
    </section>
  );
};

const StoreHandover = () => {
  const { staff } = useOutletContext();
  const { handovers, isLoading } = useStoreHandovers(staff?.warehouse_id);
  const { orders } = useStoreQueue(staff?.warehouse_id);
  const noRider = orders.filter((order) => deriveStage(order) === "READY");

  return (
    <StorePage title="Rider handover" subtitle="Enter the code from the rider's app to hand the order over">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : handovers.length === 0 ? (
        <p className={`${CARD} p-5 text-sm text-muted-foreground`}>No riders waiting at the store right now.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:gap-4 xl:grid-cols-3">
          {handovers.map((order) => (
            <HandoverCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {noRider.length > 0 && (
        <section className={`${CARD} overflow-hidden`}>
          <h2 className="px-4 py-3.5 text-[15px] lg:px-5 lg:text-base">Packed, no rider yet</h2>
          <ul>
            {noRider.map((order) => (
              <li key={order.id} className="flex items-center gap-3 border-t border-border bg-[#FDECEA]/60 px-4 py-3 lg:bg-card lg:px-5">
                <AlertCircle className="h-[18px] w-[18px] shrink-0 text-[#B42318] lg:hidden" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm lg:flex-row lg:gap-6">
                  <strong>#{order.order_number || order.id}</strong>
                  <span className="text-muted-foreground">
                    {order.items?.length || 0} items · placed {time(order.placed_at || order.created_at)}
                  </span>
                </span>
                <Link to={`/store/orders/${order.id}`} className="text-[13px] font-bold text-primary">
                  Assign rider
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </StorePage>
  );
};

export default StoreHandover;
