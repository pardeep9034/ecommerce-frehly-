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

// "Other" is the note itself; any other reason is its label, plus the note when there is one.
export const failureText = (code, note) => {
  if (code === "OTHER") return note;
  return note ? `${FAILURE_REASONS[code]} — ${note}` : FAILURE_REASONS[code];
};
