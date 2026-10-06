import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, RotateCcw } from "lucide-react";
import { useOrderDetail } from "@/hooks/use-order";
import { useCustomerStats } from "@/hooks/use-customer";
import { StatusBadge, PaymentStatusBadge } from "@/components/dashboard/OrderTable";
import OrderFulfillmentTab from "@/components/dashboard/OrderFulfillmentTab";
import DeliveryAssignmentTab from "@/components/dashboard/DeliveryAssignmentTab";
import { toast } from "@/components/ui/sonner";
import useWarehouse from "@/hooks/use-warehouse";
import { getDemoFulfilment } from "@/lib/orderDemoData";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

const PaymentRow = ({ label, value, bold }) => (
  <div className="flex items-center justify-between py-1.5 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={bold ? "font-bold text-foreground" : "font-medium text-foreground"}>{value}</span>
  </div>
);

const AdminOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { warehouses } = useWarehouse(1, 100);
  const { order, isLoading, isError } = useOrderDetail(orderId);
  const customerStats = useCustomerStats(order?.user_id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-32 rounded skeleton-shimmer" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="h-48 rounded-xl skeleton-shimmer" />
            <div className="h-64 rounded-xl skeleton-shimmer" style={{ animationDelay: "120ms" }} />
          </div>
          <div className="h-64 rounded-xl skeleton-shimmer" style={{ animationDelay: "240ms" }} />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg font-medium text-foreground">Order not found or failed to load</p>
        <button
          type="button"
          onClick={() => navigate("/dashboard/orders")}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </button>
      </div>
    );
  }

  const address = order.address;
  const refundedAmount = Number(order.refunded_amount || 0);
  const statusHistory = [...(order.statusHistory || [])].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
  const fulfilment = getDemoFulfilment(order.id); // picker and rider are still sample data
  const warehouseName = order.warehouse_id
    ? warehouses.find((warehouse) => String(warehouse.id) === String(order.warehouse_id))?.name ?? `Warehouse #${order.warehouse_id}`
    : "Not assigned";

  return (
    <div className="space-y-6 lg:space-y-7">
      <button
        type="button"
        onClick={() => navigate("/dashboard/orders")}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </button>

      <div className="rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">{order.order_number}</h1>
              <StatusBadge status={order.status} />
              <PaymentStatusBadge status={order.payment_status} />
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">Placed {formatDateTime(order.created_at)}</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => toast("Invoice generation isn't wired up yet")}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <FileText className="h-4 w-4" />
              Invoice
            </button>
            <button
              type="button"
              onClick={() => toast("Manual refunds aren't wired up yet")}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" />
              Issue refund
            </button>
          </div>
        </div>

        {refundedAmount > 0 && (
          <div className="mt-4 rounded-lg bg-violet/10 px-4 py-2.5 text-sm font-medium text-violet">
            ₹{refundedAmount.toFixed(2)} refunded on this order
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <OrderFulfillmentTab order={order} />

          <div className="rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
            <h2 className="font-display text-base font-semibold text-foreground">Payment</h2>
            <div className="mt-2 divide-y divide-border">
              <PaymentRow label="Subtotal" value={`₹${Number(order.subtotal).toFixed(2)}`} />
              <PaymentRow label="Delivery fee" value={`₹${Number(order.delivery_fee).toFixed(2)}`} />
              <PaymentRow label="Discount" value={`₹${Number(order.discount_amount || 0).toFixed(2)}`} />
              <PaymentRow label="Refunded" value={`₹${refundedAmount.toFixed(2)}`} />
              <PaymentRow label="Total" value={`₹${Number(order.total_amount).toFixed(2)}`} bold />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-semibold text-foreground">Customer</h2>
              <button
                type="button"
                onClick={() => navigate(`/dashboard/customers?customer=${order.user_id}`)}
                className="text-sm font-medium text-primary hover:underline"
              >
                View customer
              </button>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">{address?.full_name || `Customer #${order.user_id}`}</p>
            <p className="text-xs text-muted-foreground">Customer #{order.user_id}{address?.phone ? ` · ${address.phone}` : ""}</p>
            {customerStats && (
              <p className="mt-2 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                {customerStats.orders} {customerStats.orders === 1 ? "order" : "orders"} · ₹{customerStats.spent.toLocaleString("en-IN")} spent
              </p>
            )}
            {address && (
              <p className="mt-2 text-sm text-muted-foreground">
                {[address.address_line_1, address.address_line_2, address.landmark, address.city, address.state, address.postal_code]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
            <h2 className="font-display text-base font-semibold text-foreground">Fulfilment</h2>
            <div className="mt-2 divide-y divide-border">
              <PaymentRow label="Warehouse" value={warehouseName} />
              <PaymentRow label="Picked by" value={fulfilment.picker} />
              <PaymentRow label="Rider" value={fulfilment.rider} />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Picked by and Rider are demo data — not tracked by the backend yet.</p>
          </div>

          <DeliveryAssignmentTab order={order} />

          <div className="rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
            <h2 className="font-display text-base font-semibold text-foreground">Status history</h2>
            <ol className="mt-3">
              {statusHistory.map((entry, index) => (
                <li key={entry.id} className="flex gap-3">
                  <span className="flex flex-col items-center">
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        index === statusHistory.length - 1 ? "bg-accent" : "bg-primary"
                      }`}
                    />
                    {index < statusHistory.length - 1 && <span className="w-px flex-1 bg-border" />}
                  </span>
                  <span className="flex-1 pb-4">
                    <p className="text-sm font-medium text-foreground">
                      {String(entry.new_status || "").replaceAll("_", " ").toLowerCase()}
                    </p>
                    {entry.remarks && <p className="mt-0.5 text-xs text-muted-foreground">{entry.remarks}</p>}
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</p>
                  </span>
                </li>
              ))}

              {statusHistory.length === 0 && (
                <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>
              )}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
