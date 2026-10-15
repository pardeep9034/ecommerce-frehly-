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

// What the screens call each step GET /delivery-partners/me/assignments reports in `status`.
export const STEP_LABEL = {
  ASSIGNED: "Assigned",
  PICKED_UP: "Picked up",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  DELIVERY_FAILED: "Failed",
  TRANSFERRED: "Transferred",
  CANCELLED: "Cancelled",
};

// Position of an open step in the Stepper (Assigned, Picked up, On the way, Delivered).
export const STEP_INDEX = { ASSIGNED: 0, PICKED_UP: 1, OUT_FOR_DELIVERY: 2, DELIVERED: 3 };

// ponytail: Freshly delivers in India only, so times and days are IST, the same day the backend's date=today uses.
const IST = "Asia/Kolkata";
const ymd = (date) => date.toLocaleDateString("en-CA", { timeZone: IST });

export const timeOf = (iso) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: IST });

// "Today" / "Yesterday" / "24 Sep".
export const dayOf = (iso) => {
  const date = new Date(iso);
  if (ymd(date) === ymd(new Date())) return "Today";
  if (ymd(date) === ymd(new Date(Date.now() - 24 * 60 * 60 * 1000))) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: IST });
};

export const initialsOf = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join("");

// Google Maps directions link: the saved point when there is one, else the address text.
export const mapsUrl = (latitude, longitude, address) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(latitude != null && longitude != null ? `${latitude},${longitude}` : address)}`;
