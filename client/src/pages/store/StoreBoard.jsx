import { Link } from "react-router-dom";
import { useStoreQueue } from "../../hooks/use-store";
import { STAGES, deriveStage } from "../../lib/orderStage";

const StoreBoard = () => {
  const { orders, isLoading } = useStoreQueue();

  const columns = STAGES.map((stage) => ({
    ...stage,
    orders: orders.filter((order) => deriveStage(order) === stage.key),
  }));

  return (
    <div className="flex h-full flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground">{orders.length} orders in today's slot</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-3 overflow-x-auto sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {columns.map((column) => (
            <section key={column.key} className="flex min-w-[220px] flex-col gap-2.5 rounded-2xl bg-[#E9ECEA] p-3">
              <div className="flex items-center gap-2 px-1">
                <h2 className="flex-grow text-sm font-bold text-foreground">{column.label}</h2>
                <span className="text-sm font-bold text-muted-foreground">{column.orders.length}</span>
              </div>

              {column.orders.length === 0 ? (
                <p className="px-1 text-xs text-muted-foreground">No orders</p>
              ) : (
                column.orders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/store/orders/${order.id}`}
                    className="flex flex-col gap-1.5 rounded-xl border border-border bg-white p-3 text-foreground transition-colors hover:border-primary/40"
                  >
                    <span className="font-bold">#{order.order_number || order.id}</span>
                    <span className="text-xs text-muted-foreground">
                      {order.items?.length || order.item_count || 0} items
                      {order.delivery_zone ? ` · ${order.delivery_zone}` : ""}
                    </span>
                  </Link>
                ))
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoreBoard;
