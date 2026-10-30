import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Clock, RotateCcw } from "lucide-react";
import { useStoreQueue } from "../../hooks/use-store";
import { STAGES, deriveStage } from "../../lib/orderStage";
import StageBadge from "../../components/store/StageBadge";
import StorePage, { BTN } from "../../components/store/StorePage";

const COLUMNS = STAGES.filter((stage) => !["CANCELLED", "RETURN"].includes(stage.key));

// Phone-only call to action per stage; on web the whole card opens the order.
const CTA = {
  NEW: "Start picking",
  PICKING: "Continue picking",
  WAITING: "View order",
  PACKING: "Pack order",
  READY: "Assign rider",
  ASSIGNED: "Hand over",
};

const time = (date) => (date ? new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "");
const isToday = (date) => !!date && new Date(date).toDateString() === new Date().toDateString();

const cardMeta = (order, stage) => {
  const items = order.items || [];
  if (stage === "PICKING") return `${items.filter((i) => i.status !== "PENDING").length} of ${items.length} checked`;
  if (stage === "WAITING") {
    const missing = items.filter((i) => i.status === "NOT_AVAILABLE").map((i) => i.product_name);
    return missing.length ? `${missing.join(", ")} unavailable` : `${items.length} items`;
  }
  return `${items.length || order.item_count || 0} items`;
};

const OrderCard = ({ order, stage }) => (
  <section className="relative flex flex-col gap-2.5 rounded-2xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-primary/40 lg:gap-1.5 lg:rounded-xl lg:p-3">
    <div className="flex items-center justify-between gap-2">
      {/* Stretched link: the whole card opens the order; the CTA sits above it. */}
      <Link
        to={`/store/orders/${order.id}`}
        className="text-base font-bold text-foreground underline underline-offset-[3px] after:absolute after:inset-0 after:content-[''] lg:text-sm lg:no-underline"
      >
        <span className="lg:hidden">Order </span>#{order.order_number || order.id}
      </Link>
      <span className="lg:hidden">
        <StageBadge stage={stage} />
      </span>
    </div>
    <div className="flex flex-wrap gap-x-3.5 text-[13px] text-muted-foreground">
      <span>{cardMeta(order, stage)}</span>
      {order.address?.full_name && <span>{order.address.full_name}</span>}
    </div>
    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground lg:text-xs">
      <Clock className="h-3.5 w-3.5" /> Placed {time(order.placed_at || order.created_at)}
    </span>
    <Link
      to={stage === "ASSIGNED" ? "/store/handover" : `/store/orders/${order.id}`}
      className={`${BTN.primary} relative z-10 h-[46px] rounded-xl text-[15px] lg:hidden`}
    >
      {CTA[stage]}
    </Link>
  </section>
);

const StoreBoard = () => {
  const { staff } = useOutletContext();
  const { orders, isLoading } = useStoreQueue(staff?.warehouse_id);
  const [tab, setTab] = useState(COLUMNS[0].key);

  const columns = COLUMNS.map((stage) => ({
    ...stage,
    orders: orders.filter((order) => deriveStage(order) === stage.key),
  }));
  const openCount = columns.reduce((sum, column) => sum + column.orders.length, 0);

  // ponytail: "put back" is today's cancellations that had picked items; nothing records
  // that the items went back, so the alert clears at midnight. Add a returned flag to drop it sooner.
  const putBack = orders.filter(
    (order) => deriveStage(order) === "CANCELLED" && isToday(order.updated_at) && order.items?.some((i) => i.status === "READY")
  );

  return (
    <StorePage title="Orders" subtitle={[staff?.warehouse_name, `${openCount} open orders`].filter(Boolean).join(" · ")}>
      {/* Phone: one stage at a time behind tabs. Web: every stage as a column. */}
      <div role="tablist" aria-label="Order stages" className="-mx-4 -mt-4 flex gap-1 overflow-x-auto border-b border-border bg-card px-4 lg:hidden">
        {columns.map((column) => (
          <button
            key={column.key}
            type="button"
            role="tab"
            aria-selected={tab === column.key}
            onClick={() => setTab(column.key)}
            className={`flex min-h-11 shrink-0 items-center gap-1.5 border-b-[3px] px-1.5 text-[13px] ${
              tab === column.key ? "border-primary font-bold text-primary" : "border-transparent font-medium text-muted-foreground"
            }`}
          >
            {column.label}
            <span className="rounded-full bg-muted px-1.5 text-xs">{column.orders.length}</span>
          </button>
        ))}
      </div>

      {putBack.map((order) => (
        <Link
          key={order.id}
          to={`/store/orders/${order.id}`}
          className="flex items-center gap-2.5 rounded-xl bg-[#FDECEA] px-3 py-2.5 text-[#B42318] lg:px-4 lg:py-3"
        >
          <RotateCcw className="h-[18px] w-[18px] shrink-0" />
          <span className="flex-1 text-[13px] text-foreground">
            <strong className="text-[#B42318]">Put back · #{order.order_number || order.id}</strong> cancelled after picking ·{" "}
            {order.items.filter((i) => i.status === "READY").length} items to return to shelves
          </span>
          <span className="text-[13px] font-bold">Open</span>
        </Link>
      ))}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="flex flex-1 flex-col lg:grid lg:grid-cols-3 lg:items-start lg:gap-2.5 xl:grid-cols-6">
          {columns.map((column) => (
            <section
              key={column.key}
              aria-label={column.label}
              className={`${tab === column.key ? "flex" : "hidden"} min-w-0 flex-col gap-3 lg:flex lg:gap-2.5 lg:rounded-2xl lg:bg-[#E9ECEA] lg:p-3`}
            >
              <div className="hidden items-center justify-between gap-2 lg:flex">
                <h2 className="min-w-0 truncate text-sm">
                  <StageBadge stage={column.key} />
                </h2>
                <span className="text-[13px] font-bold text-muted-foreground">{column.orders.length}</span>
              </div>
              {column.orders.length === 0 ? (
                <p className="px-1 py-6 text-center text-sm text-muted-foreground lg:py-0 lg:text-left lg:text-xs">No orders</p>
              ) : (
                column.orders.map((order) => <OrderCard key={order.id} order={order} stage={column.key} />)
              )}
            </section>
          ))}
        </div>
      )}
    </StorePage>
  );
};

export default StoreBoard;
