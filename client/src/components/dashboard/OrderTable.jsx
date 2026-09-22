import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUS_STYLES = {
  DELIVERED: "bg-success/10 text-success",
  CONFIRMED: "bg-success/10 text-success",
  PLACED: "bg-primary/10 text-primary",
  READY_FOR_ASSIGNMENT: "bg-primary/10 text-primary",
  ASSIGNED: "bg-primary/10 text-primary",
  PICKED_UP: "bg-primary/10 text-primary",
  OUT_FOR_DELIVERY: "bg-primary/10 text-primary",
  HANDOVER_IN_PROGRESS: "bg-primary/10 text-primary",
  CANCELLED: "bg-warning/10 text-warning-foreground",
  PAYMENT_FAILED: "bg-warning/10 text-warning-foreground",
  PAYMENT_EXPIRED: "bg-warning/10 text-warning-foreground",
  DELIVERY_FAILED: "bg-warning/10 text-warning-foreground",
};

export const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
      STATUS_STYLES[status] || "bg-muted text-muted-foreground"
    }`}
  >
    {String(status || "").replaceAll("_", " ").toLowerCase()}
  </span>
);

const OrderTable = ({ orders = [], isLoading }) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Order</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Customer</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Placed</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Status</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Payment</th>
              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Total</th>
              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Actions</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted">
                <td className="px-5 py-4 font-medium text-foreground sm:px-6">{order.order_number}</td>
                <td className="px-5 py-4 text-muted-foreground sm:px-6">#{order.user_id}</td>
                <td className="px-5 py-4 text-muted-foreground sm:px-6">
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-5 py-4 sm:px-6">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-5 py-4 sm:px-6">
                  <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                    {String(order.payment_status || "").toLowerCase()}
                  </span>
                </td>
                <td className="px-5 py-4 text-right font-medium text-foreground sm:px-6">
                  ₹{Number(order.total_amount).toFixed(2)}
                </td>
                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {orders.length === 0 && !isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No orders found.
                </td>
              </tr>
            )}

            {isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTable;
