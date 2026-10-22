import { X, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const initials = (name = "") =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

const CustomerDetailPanel = ({ customer, onClose, onToggleBlock, isUpdating }) => {
  const navigate = useNavigate();

  return (
    <aside className="flex w-full shrink-0 animate-in flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-card duration-200 fade-in slide-in-from-right-4 lg:w-85">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent-foreground">
            {initials(customer.name)}
          </span>
          <div>
            <p className="font-display text-base font-semibold text-foreground">{customer.name}</p>
            <p className="text-xs text-muted-foreground">{customer.phone}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground break-all">{customer.email}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Orders</p>
          <p className="mt-1 text-xl font-bold text-foreground">{customer.orders ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Spent</p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {customer.spent != null ? `₹${customer.spent.toLocaleString("en-IN")}` : "—"}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-foreground">Addresses</p>
        {customer.addresses.length ? (
          <ul className="space-y-1.5">
            {customer.addresses.map((address, index) => (
              <li key={`${address}-${index}`} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {address}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No saved addresses.</p>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-foreground">Last orders</p>
        {customer.recentOrders.length ? (
          <ul className="space-y-1.5">
            {customer.recentOrders.map((order) => (
              <li key={order.id} className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                  className="font-medium text-primary hover:underline"
                >
                  #{order.id}
                </button>
                <span className="text-muted-foreground">
                  ₹{order.total} · {new Date(order.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No orders yet.</p>
        )}
      </div>

      <div className="mt-auto flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => onToggleBlock(customer)}
          disabled={isUpdating}
          className="flex-1 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {customer.status === "Blocked" ? "Unblock customer" : "Block customer"}
        </button>
        <button
          type="button"
          onClick={() => navigate(`/admin/orders?customer=${customer.id}`)}
          className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          View orders
        </button>
      </div>
    </aside>
  );
};

export default CustomerDetailPanel;
