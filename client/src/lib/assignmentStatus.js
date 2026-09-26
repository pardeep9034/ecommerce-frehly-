// Forward-only status transitions a partner can trigger themselves.
// DELIVERY_FAILED is separate since it always needs a reason.
export const NEXT_STATUS = {
  ASSIGNED: "PICKED_UP",
  PICKED_UP: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

export const NEXT_LABEL = {
  ASSIGNED: "Confirm pickup",
  PICKED_UP: "Start delivery",
  OUT_FOR_DELIVERY: "Mark delivered",
};
