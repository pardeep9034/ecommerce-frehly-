import { useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useOrderFulfillment } from "@/hooks/use-order";

const REVIEWABLE_STATUSES = ["PLACED", "CONFIRMED"];

const STATUS_BADGE = {
  READY: "bg-success/10 text-success",
  NOT_AVAILABLE: "bg-warning/10 text-warning-foreground",
  PENDING: "bg-muted text-muted-foreground",
};

const ItemRow = ({ item, editable, onSetStatus, saving }) => {
  const [remarks, setRemarks] = useState(item.admin_remarks || "");

  return (
    <tr className="border-b border-border transition-colors last:border-0 hover:bg-muted">
      <td className="px-5 py-4 sm:px-6">
        <p className="font-medium text-foreground">{item.product_name}</p>
        <p className="text-xs text-muted-foreground">{item.variant_name}</p>
      </td>
      <td className="px-5 py-4 text-right text-foreground sm:px-6">{Number(item.quantity)}</td>
      <td className="px-5 py-4 text-right font-medium text-foreground sm:px-6">₹{Number(item.line_total).toFixed(2)}</td>
      <td className="px-5 py-4 sm:px-6">
        {editable ? (
          <input
            type="text"
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="This item is not present"
            className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
          />
        ) : (
          <p className="text-xs text-muted-foreground">{item.admin_remarks || "—"}</p>
        )}
      </td>
      <td className="px-5 py-4 sm:px-6">
        {editable ? (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => onSetStatus(item.id, "READY", null)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                item.status === "READY"
                  ? "bg-success text-white"
                  : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ready
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => onSetStatus(item.id, "NOT_AVAILABLE", remarks || "This item is not present")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                item.status === "NOT_AVAILABLE"
                  ? "bg-warning text-warning-foreground"
                  : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <XCircle className="h-3.5 w-3.5" />
              Not available
            </button>
          </div>
        ) : (
          <div className="flex justify-end">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[item.status] || STATUS_BADGE.PENDING}`}>
              {item.status.replaceAll("_", " ").toLowerCase()}
            </span>
          </div>
        )}
      </td>
    </tr>
  );
};

const OrderFulfillmentTab = ({ order }) => {
  const { updateItemStatus, finalizeItems } = useOrderFulfillment(order.id);
  const items = order.items || [];
  const editable = REVIEWABLE_STATUSES.includes(order.status);

  const reviewedCount = items.filter((item) => item.status !== "PENDING").length;
  const allReviewed = items.length > 0 && reviewedCount === items.length;

  const handleSetStatus = (itemId, status, remarks) => {
    updateItemStatus.mutate(
      { itemId, status, remarks },
      { onError: () => toast.error("Unable to update item status") }
    );
  };

  const handleFinalize = () => {
    finalizeItems.mutate(undefined, {
      onSuccess: (result) => {
        const status = result?.data?.status;
        if (status === "READY_FOR_ASSIGNMENT") {
          toast.success("All items ready — order moved to assignment.");
        } else if (status === "CANCELLED") {
          toast.success("All items unavailable — order cancelled and refunded.");
        } else {
          toast.success("Some items unavailable — customer asked to confirm.");
        }
      },
      onError: () => toast.error("Unable to finalize items"),
    });
  };

  return (
    <div className="space-y-4">
      {editable ? (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-white px-5 py-3 shadow-card sm:flex-row sm:items-center sm:px-6">
          <p className="text-sm text-muted-foreground">
            {reviewedCount} of {items.length} items reviewed
          </p>
          <button
            type="button"
            disabled={!allReviewed || finalizeItems.isPending}
            onClick={handleFinalize}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              !allReviewed || finalizeItems.isPending ? "cursor-not-allowed bg-gray-300" : "bg-primary hover:bg-primary/90"
            }`}
          >
            {finalizeItems.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Finalize &amp; Notify Customer
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white px-5 py-3 text-sm text-muted-foreground shadow-card sm:px-6">
          {order.status === "AWAITING_CUSTOMER_CONFIRMATION"
            ? "Waiting for the customer to confirm the partial order."
            : `Item review is closed for this order (status: ${order.status}).`}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Item</th>
                <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Qty</th>
                <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Total</th>
                <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Remarks</th>
                <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <ItemRow key={item.id} item={item} editable={editable} onSetStatus={handleSetStatus} saving={updateItemStatus.isPending} />
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
    </div>
  );
};

export default OrderFulfillmentTab;
