// Forward-only status transitions a partner can trigger themselves.
// DELIVERY_FAILED is separate since it always needs a reason. ASSIGNED -> PICKED_UP is the
// store's step: it enters the pickup code the Pickup screen shows.
export const NEXT_STATUS = {
  PICKED_UP: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

export const NEXT_LABEL = {
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
  // Return pickups (kind RETURN_PICKUP).
  RETURN_PICKUP: "Return pickup",
  COLLECTED: "Collected",
  NOT_COLLECTED: "Not collected",
};

// The screen a job belongs on now (a GET /delivery-partners/me/assignments/:id row).
export const jobPath = (a) =>
  a.assignment_status !== "ACTIVE" ? "/partner/home"
    : a.kind === "RETURN_PICKUP" ? `/partner/orders/${a.id}/collect`
      : a.status === "ASSIGNED" ? `/partner/orders/${a.id}/pickup`
        : `/partner/orders/${a.id}/deliver`;

// Why the rider is being moved: the job was already finished, or is already on another step.
export const jobNote = (a) => {
  const pickup = a.kind === "RETURN_PICKUP";
  return {
    COMPLETED: pickup ? "Already marked collected" : "This order was already delivered",
    FAILED: pickup ? "Already marked not collected" : "This order was already marked not delivered",
    TRANSFERRED: "This order was handed to another rider",
    CANCELLED: "This order was cancelled",
  }[a.assignment_status] ?? `This order is already ${(STEP_LABEL[a.status] ?? "moved on").toLowerCase()}`;
};

// Position of an open step in the Stepper (Assigned, Picked up, On the way, Delivered).
// Same codes as delivery-service's constants/deliveryFailure.js. OTHER needs a note.
export const FAILED_REASONS = [
  { code: "CUSTOMER_NOT_REACHABLE", label: "Customer not reachable" },
  { code: "NOT_AT_LOCATION", label: "Customer not at location" },
  { code: "WRONG_ADDRESS", label: "Wrong or incomplete address" },
  { code: "REFUSED", label: "Customer refused order" },
  { code: "OTHER", label: "Other" },
];

// Why the customer turned an item away at the door. Same codes as DOOR_REJECT_REASONS there. OTHER needs a note.
export const DOOR_REJECT_REASONS = [
  { code: "NOT_WANTED", label: "Didn't want it" },
  { code: "WRONG_ITEM", label: "Wrong item" },
  { code: "DAMAGED", label: "Damaged" },
  { code: "BAD_QUALITY", label: "Bad quality" },
  { code: "OTHER", label: "Other" },
];

// Why a customer asks to return an item after delivery (order-service CUSTOMER_RETURN_REASONS).
export const CUSTOMER_RETURN_REASONS = [
  { code: "DAMAGED", label: "Damaged" },
  { code: "BAD_QUALITY", label: "Bad quality" },
  { code: "WRONG_ITEM", label: "Wrong item sent" },
  { code: "MISSING", label: "Missing from the bag" },
  { code: "OTHER", label: "Something else" },
];
// The store's internal reason for turning a return down. Never shown to the customer.
export const RETURN_REJECT_REASONS = [
  { code: "OUTSIDE_WINDOW", label: "Asked too late" },
  { code: "NO_PROOF", label: "Photo doesn't show the problem" },
  { code: "NOT_AS_REPORTED", label: "Not as reported" },
  { code: "QUANTITY", label: "Quantity doesn't add up" },
  { code: "OTHER", label: "Other" },
];

// "₹1,250" / "₹99.50".
export const rupees = (value) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2, maximumFractionDigits: 2 })}`;

export const STEP_INDEX ={ ASSIGNED: 0, PICKED_UP: 1, OUT_FOR_DELIVERY: 2, DELIVERED: 3 };

// The Stepper's stages, in STEP_INDEX order.
export const DELIVERY_STEPS = ["Assigned", "Picked up", "On the way", "Delivered"];

// A handover's status, as the Handover screen shows it.
export const HANDOVER_LABEL = {
  PENDING: "Requested",
  OLD_PARTNER_CONFIRMED: "Handed over",
  COMPLETED: "Received",
  CANCELLED: "Cancelled",
};

// Pill colours by label, for StatusPill (delivery steps, handovers, partner and application states).
const GREEN = "bg-success/10 text-success";
const RED = "bg-destructive/10 text-destructive";
const GREY = "bg-muted text-muted-foreground";
const AMBER = "bg-amber/10 text-amber";
const VIOLET = "bg-violet/10 text-violet";
export const STATUS_STYLE = {
  New: "bg-info/10 text-info", Assigned: "bg-info/10 text-info", "Picked up": "bg-info/10 text-info",
  "Under review": AMBER, "Out for delivery": AMBER, "To check": AMBER, Requested: AMBER,
  "Changes requested": VIOLET, Handover: VIOLET, Transferred: VIOLET, "Handed over": VIOLET,
  Active: GREEN, Online: GREEN, Delivered: GREEN, Verified: GREEN, Approved: GREEN, Received: GREEN,
  Offline: GREY, Cancelled: GREY,
  Suspended: RED, Failed: RED, "Not uploaded": RED, Rejected: RED, "Sent back": RED,
};

// ponytail: Freshly delivers in India only, so times and days are IST, the same day the backend's date=today uses.
const IST = "Asia/Kolkata";
export const ymd = (date) => date.toLocaleDateString("en-CA", { timeZone: IST });

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
