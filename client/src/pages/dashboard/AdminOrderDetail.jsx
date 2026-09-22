import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, CreditCard, Package } from "lucide-react";
import { useOrderDetail } from "@/hooks/use-order";
import OrderFulfillmentTab from "@/components/dashboard/OrderFulfillmentTab";

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value || "N/A"}</p>
    </div>
  </div>
);

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "fulfillment", label: "Fulfillment" },
];

const AdminOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { order, isLoading, isError } = useOrderDetail(orderId);
  const [activeTab, setActiveTab] = useState("overview");

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

  const items = order.items || [];
  const address = order.address;
  const refundedAmount = Number(order.refunded_amount || 0);

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

      <div className="rounded-xl border border-border bg-white shadow-card">
        <div className="flex flex-col gap-6 p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">{order.order_number}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Placed on{" "}
                {new Date(order.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary">
              {String(order.status || "").replaceAll("_", " ").toLowerCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <InfoItem icon={Package} label="Customer" value={`#${order.user_id}`} />
            <InfoItem icon={CreditCard} label="Payment" value={String(order.payment_status || "").toLowerCase()} />
            <InfoItem icon={MapPin} label="Delivery fee" value={`₹${Number(order.delivery_fee).toFixed(2)}`} />
            <InfoItem icon={CreditCard} label="Total" value={`₹${Number(order.total_amount).toFixed(2)}`} />
          </div>

          {refundedAmount > 0 && (
            <div className="rounded-lg bg-warning/10 px-4 py-2.5 text-sm font-medium text-warning-foreground">
              ₹{refundedAmount.toFixed(2)} refunded on this order
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <>
          {address && (
            <div className="rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
              <h2 className="font-display text-lg font-semibold text-foreground">Delivery Address</h2>
              <p className="mt-2 text-sm text-foreground">{address.full_name} • {address.phone}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {[address.address_line_1, address.address_line_2, address.landmark, address.city, address.state, address.postal_code]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Items ({items.length})
            </h2>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Product</th>
                    <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Variant</th>
                    <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Qty</th>
                    <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Price</th>
                    <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted">
                      <td className="px-5 py-4 font-medium text-foreground sm:px-6">{item.product_name}</td>
                      <td className="px-5 py-4 text-muted-foreground sm:px-6">{item.variant_name}</td>
                      <td className="px-5 py-4 text-right text-foreground sm:px-6">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-5 py-4 text-right text-foreground sm:px-6">₹{Number(item.selling_price).toFixed(2)}</td>
                      <td className="px-5 py-4 text-right font-medium text-foreground sm:px-6">₹{Number(item.line_total).toFixed(2)}</td>
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                        No items in this order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <OrderFulfillmentTab order={order} />
      )}
    </div>
  );
};

export default AdminOrderDetail;
