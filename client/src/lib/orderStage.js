// Derives a store-console "stage" from the real order.status, the item statuses and
// packed_at (set by POST /orders/:orderId/pack). There is no PICKING/PACKING value in
// ORDER_STATUS; this is a client-side view, not a new enum.
export const STAGES = [
  { key: "NEW", label: "New" },
  { key: "PICKING", label: "Picking" },
  { key: "WAITING", label: "Waiting on customer" },
  { key: "PACKING", label: "Packing" },
  { key: "READY", label: "Ready for pickup" },
  { key: "ASSIGNED", label: "Rider assigned" },
  // Not delivered: with the rider on the way back (DELIVERY_FAILED) or back in the store. Shown on the Returns page.
  { key: "RETURN", label: "Not delivered" },
  { key: "CANCELLED", label: "Cancelled" },
];

export const deriveStage = (order) => {
  if (!order) return null;
  if (order.status === "CANCELLED") return "CANCELLED";
  if (order.status === "DELIVERY_FAILED" || order.status === "RETURNED_TO_STORE") return "RETURN";
  if (order.status === "AWAITING_CUSTOMER_CONFIRMATION") return "WAITING";
  if (order.status === "ASSIGNED" || order.status === "PICKED_UP" || order.status === "OUT_FOR_DELIVERY" || order.status === "HANDOVER_IN_PROGRESS") {
    return "ASSIGNED";
  }
  if (order.status === "READY_FOR_ASSIGNMENT") {
    return order.packed_at ? "READY" : "PACKING";
  }
  if (order.status === "PLACED" || order.status === "CONFIRMED") {
    const items = order.items || [];
    const anyReviewed = items.some((item) => item.status && item.status !== "PENDING");
    return anyReviewed ? "PICKING" : "NEW";
  }
  return null;
};

// Store console palette (Freshly Store Operations UI design). Also tints the status banners.
export const STAGE_STYLES = {
  NEW: "bg-[#E6EEF9] text-[#1E4F91]",
  PICKING: "bg-[#FEF4D6] text-[#7A5500]",
  WAITING: "bg-[#F0E9FA] text-[#5E3591]",
  PACKING: "bg-[#E0F2F4] text-[#0B5C6B]",
  READY: "bg-[#E3F1E8] text-[#166434]",
  ASSIGNED: "bg-[#E6EEF9] text-[#1E4F91]",
  RETURN: "bg-[#FEF4D6] text-[#7A5500]",
  CANCELLED: "bg-[#FDECEA] text-[#B42318]",
};
