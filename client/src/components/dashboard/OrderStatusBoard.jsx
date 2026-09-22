import { useNavigate } from "react-router-dom";
import { useOrderStatusBoard } from "@/hooks/use-order";
import { StatusBadge } from "./OrderTable";

const ShimmerBar = ({ className = "", delay = "0ms" }) => (
  <div style={{ animationDelay: delay }} className={`skeleton-shimmer rounded ${className}`} />
);

const OrderCardSkeleton = ({ delay = "0ms" }) => (
  <div className="rounded-lg border border-border bg-white p-2.5">
    <div className="flex items-center justify-between">
      <ShimmerBar className="h-3 w-16" delay={delay} />
      <ShimmerBar className="h-3 w-9" delay={delay} />
    </div>
    <ShimmerBar className="mt-2 h-2.5 w-24" delay={delay} />
  </div>
);

const OrderStatusBoard = ({ statuses, previewLimit = 20, search = "" }) => {
  const navigate = useNavigate();
  const { columns } = useOrderStatusBoard(statuses, previewLimit, search);

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        Order Pipeline
      </h2>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {columns.map((column) => (
          <div
            key={column.status}
            className="flex w-64 shrink-0 flex-col rounded-lg border border-border bg-muted/40"
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <StatusBadge status={column.status} />
              {column.isLoading ? (
                <ShimmerBar className="h-3 w-4" />
              ) : (
                <span className="text-xs font-bold text-foreground">{column.total}</span>
              )}
            </div>

            <div className="max-h-[60vh] flex-1 space-y-2 overflow-y-auto p-2">
              {column.isLoading ? (
                <>
                  <OrderCardSkeleton delay="0ms" />
                  <OrderCardSkeleton delay="120ms" />
                  <OrderCardSkeleton delay="240ms" />
                </>
              ) : column.orders.length === 0 ? (
                <p className="px-2 py-4 text-center text-xs text-muted-foreground">No orders</p>
              ) : (
                column.orders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                    className="block w-full rounded-lg border border-border bg-white p-2.5 text-left text-xs transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between font-medium text-foreground">
                      <span>{order.order_number}</span>
                      <span>₹{Number(order.total_amount).toFixed(0)}</span>
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      #{order.user_id} ·{" "}
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </button>
                ))
              )}
            </div>

            {column.total > column.orders.length && (
              <p className="border-t border-border px-3 py-2 text-center text-[11px] font-medium text-muted-foreground">
                Showing {column.orders.length} of {column.total}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderStatusBoard;
