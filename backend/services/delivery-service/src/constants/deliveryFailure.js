// Why a partner could not deliver. The label is what gets saved and shown (delivery_attempts.failure_reason).
export const FAILURE_REASONS = {
  CUSTOMER_NOT_REACHABLE: "Customer not reachable",
  NOT_AT_LOCATION: "Customer not at location",
  WRONG_ADDRESS: "Wrong or incomplete address",
  REFUSED: "Customer refused order",
  OTHER: "Other",
};

// After this many failed drops an order cannot be assigned again; the store has to cancel or return it.
export const MAX_DELIVERY_ATTEMPTS = 3;

// Failures that end retries: the goods go back to the store and the order is cancelled there.
export const FINAL_FAILURES = new Set(["REFUSED"]);

// Why the customer turned an item away at the door (order_returns.reason). ponytail: order-service's validate.js
// DOOR_REJECT_REASONS says the same; change both together.
export const DOOR_REJECT_REASONS = {
  NOT_WANTED: "Didn't want it",
  WRONG_ITEM: "Wrong item",
  DAMAGED: "Damaged",
  BAD_QUALITY: "Bad quality",
  OTHER: "Other",
};

// A rider holding goods owed to the store longer than this is flagged to the store.
export const RETURN_OVERDUE_MS = 2 * 60 * 60 * 1000;

// "Other" is the note itself; any other reason is its label, plus the note when there is one.
export const failureText = (code, note) => {
  if (code === "OTHER") return note;
  return note ? `${FAILURE_REASONS[code]} — ${note}` : FAILURE_REASONS[code];
};
