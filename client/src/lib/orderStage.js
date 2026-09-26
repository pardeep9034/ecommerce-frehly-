// Derives a store-console "stage" from the real order.status plus two fields
// that don't exist on Order yet (is_packed, has_rider) — see
// STORE_OPERATIONS_MODULE.md, backend change #2. There is no PICKING/PACKING
// value in ORDER_STATUS today; this is a client-side view, not a new enum.
export const STAGES = [
  { key: "NEW", label: "New" },
  { key: "PICKING", label: "Picking" },
  { key: "WAITING", label: "Waiting on customer" },
  { key: "PACKING", label: "Packing" },
  { key: "READY", label: "Ready for pickup" },
  { key: "ASSIGNED", label: "Rider assigned" },
  { key: "CANCELLED", label: "Cancelled" },
];

export const deriveStage = (order) => {
  if (!order) return null;
  if (order.status === "CANCELLED" || order.status === "DELIVERY_FAILED") return "CANCELLED";
  if (order.status === "AWAITING_CUSTOMER_CONFIRMATION") return "WAITING";
  if (order.status === "ASSIGNED" || order.status === "PICKED_UP" || order.status === "OUT_FOR_DELIVERY" || order.status === "HANDOVER_IN_PROGRESS") {
    return "ASSIGNED";
  }
  if (order.status === "READY_FOR_ASSIGNMENT") {
    return order.is_packed ? "READY" : "PACKING";
  }
  if (order.status === "PLACED" || order.status === "CONFIRMED") {
    const items = order.items || [];
    const anyReviewed = items.some((item) => item.status && item.status !== "PENDING");
    return anyReviewed ? "PICKING" : "NEW";
  }
  return null;
};

export const STAGE_STYLES = {
  NEW: "bg-[#FDECEA] text-[#B42318]",
  PICKING: "bg-[#FEF4D6] text-[#7A5500]",
  WAITING: "bg-[#EDE7F6] text-[#5E3591]",
  PACKING: "bg-[#E0F2F4] text-[#0B5C6B]",
  READY: "bg-success/10 text-success",
  ASSIGNED: "bg-[#E6EEF9] text-[#1E4F91]",
  CANCELLED: "bg-muted text-muted-foreground",
};
