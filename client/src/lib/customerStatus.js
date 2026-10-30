// What the customer reads for each order.status. Staff screens keep the raw codes (or orderStage.js labels).
// tone picks the badge colour: moving, waiting (needs the customer), done, stopped.
const STATUS = {
  PENDING_PAYMENT: { label: "Waiting for payment", tone: "waiting" },
  PLACED: { label: "Order placed", tone: "moving" },
  CONFIRMED: { label: "Order confirmed", tone: "moving" },
  READY_FOR_ASSIGNMENT: { label: "Packing your order", tone: "moving" },
  AWAITING_CUSTOMER_CONFIRMATION: { label: "Needs your confirmation", tone: "waiting" },
  ASSIGNED: { label: "Delivery partner assigned", tone: "moving" },
  PICKED_UP: { label: "Picked up from store", tone: "moving" },
  OUT_FOR_DELIVERY: { label: "On the way", tone: "moving" },
  // A rider-to-rider swap is an internal step; for the customer the order is still coming.
  HANDOVER_IN_PROGRESS: { label: "On the way", tone: "moving" },
  DELIVERED: { label: "Delivered", tone: "done" },
  DELIVERY_FAILED: { label: "Couldn't deliver", tone: "stopped" },
  RETURNED_TO_STORE: { label: "Returned to store", tone: "stopped" },
  CANCELLED: { label: "Cancelled", tone: "stopped" },
  PAYMENT_FAILED: { label: "Payment failed", tone: "stopped" },
  PAYMENT_EXPIRED: { label: "Payment timed out", tone: "stopped" },
};

// Unknown codes (a status added later) read as "In progress" instead of leaking the raw code.
export const customerStatus = (status) => STATUS[status] ?? { label: "In progress", tone: "moving" };
