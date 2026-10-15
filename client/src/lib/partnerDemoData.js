// Fabricated / demo values only — copied from the "Freshly Delivery Partner UI" design canvas.
// What is left here has no backend yet (partner profile, partner-scoped orders, summary counts) — see the
// "Delivery partners" section of BACKEND_REQUIREMENTS.md. The application queue and review screens are live (lib/partnerReview.js).

export const ME = {
  name: "Ravi Kumar",
  initials: "RK",
  phone: "+91 98765 43210",
  email: "ravi.k@example.com",
  vehicle: "Bike",
  vehicleLabel: "Motorbike",
  vehicleNumber: "PB 65 AX 4412",
  zone: "Mohali · Sector 70",
  zones: ["Mohali · Sector 70 (primary)", "Sector 71", "Sector 69"],
  maxActive: 4,
  active: 2,
  deliveredToday: 11,
  since: "12 Mar 2026",
  slot: "7–9 AM",
};

export const STATS_7D = { delivered: 74, onTime: "96%", failed: 3, handovers: "2 given · 1 received" };

// The "Waiting for review" card is live (GET /summary); these three have no endpoint yet.
export const PARTNER_SUMMARY = [
  { label: "Active partners", value: 42, hint: "Across 6 zones" },
  { label: "Online now", value: 18, hint: "36 orders in progress" },
  { label: "Suspended", value: 3, hint: "1 this week" },
];

export const ACTIVE_ASSIGNMENTS = [
  { id: "10491", status: "Assigned", customer: "Neha S. · Sector 70", due: "Due 8:15 AM" },
  { id: "10488", status: "Out for delivery", customer: "Anand V. · Sector 71", due: "Due 7:50 AM" },
];

// Partner-side orders
const ITEMS = [
  ["Tomato (Hybrid)", "1 kg"], ["Onion", "2 kg"], ["Banana (Robusta)", "1 dozen"],
  ["Spinach", "250 g"], ["Apple (Shimla)", "1 kg"], ["Coriander", "100 g"],
];
const STORE = { name: "Freshly Dark Store · Phase 7", address: "SCO 42, Industrial Area Phase 7, Mohali", contact: "Suresh · +91 98150 •••45" };

export const ORDERS = [
  {
    id: "10491", status: "Assigned", step: 0, slot: "7–9 AM", due: "8:15 AM", pickupBy: "7:45 AM", assigned: "7:22 AM by store",
    customer: "Neha Sharma", short: "Neha S. · Sector 70", phone: "+91 98•••• 4521",
    address: "House 1123, Sector 70, Mohali, Punjab 160071", distance: "3.4 km", eta: "12 min", count: 6, total: 642, store: STORE, items: ITEMS,
  },
  {
    id: "10488", status: "Out for delivery", step: 2, slot: "7–9 AM", due: "7:50 AM", pickupBy: "7:45 AM", assigned: "7:22 AM · Auto-assigned",
    customer: "Anand Verma", short: "Anand V. · Sector 71", phone: "+91 99•••• 1180",
    address: "House 402, Sector 71, Mohali", distance: "1.2 km left", eta: "5 min", count: 4, total: 418, store: STORE, items: ITEMS.slice(0, 4),
  },
  {
    id: "10482", status: "Handover", step: 2, slot: "7–9 AM", due: "8:30 AM", pickupBy: "—", assigned: "Handed over by Amit S.",
    customer: "Kavita R.", short: "Kavita R. · Sector 71", phone: "+91 98•••• 7782",
    address: "House 88, Sector 71, Mohali", distance: "2.1 km", eta: "9 min", count: 3, total: 276, store: STORE, items: ITEMS.slice(0, 3),
  },
];

export const findOrder = (id) => ORDERS.find((o) => o.id === id) || ORDERS[0];

export const DELIVERY_STEPS = ["Assigned", "Picked up", "On the way", "Delivered"];

export const FAILED_REASONS = [
  "Customer not reachable", "Customer not at location", "Wrong or incomplete address", "Customer refused order", "Other",
];

export const INCOMING_HANDOVER = {
  order: "10482", from: "Amit Singh", fromShort: "Amit S.", initials: "AS", reason: "Bike puncture near Sector 71 market",
  meet: "Sector 71 market gate", meetDistance: "0.8 km away", deliverTo: "Kavita R. · House 88, Sector 71 · 3 items",
  timeline: [
    { title: "Request sent by Amit", sub: "7:41 AM" },
    { title: "Amit confirmed handing over", sub: "7:48 AM · at meet point" },
    { title: "You confirm receipt", sub: "Order moves to you as Out for delivery", pending: true },
  ],
};

export const NEARBY_PARTNERS = [
  { id: "n1", initials: "MK", name: "Manpreet K.", sub: "0.6 km away · 1 / 4 active" },
  { id: "n2", initials: "SD", name: "Sunil D.", sub: "1.1 km away · 2 / 4 active" },
  { id: "n3", initials: "FA", name: "Farhan A.", sub: "1.9 km away · 0 / 3 active" },
];

export const HISTORY = [
  { id: "10491", area: "Sector 70", customer: "Neha S.", day: "Today", date: "24 Sep", time: "8:02 AM", status: "Delivered", attempts: "1", note: "13 min early" },
  { id: "10479", area: "Sector 69", customer: "Rohit M.", day: "Today", date: "24 Sep", time: "7:31 AM", status: "Delivered", attempts: "1", note: "On time" },
  { id: "10476", area: "Sector 71", customer: "Pooja G.", day: "Today", date: "24 Sep", time: "7:12 AM", status: "Failed", attempts: "1", note: "Customer not reachable" },
  { id: "10470", area: "Aerocity", customer: "Arjun P.", day: "Today", date: "24 Sep", time: "6:58 AM", status: "Transferred", attempts: "—", note: "Handed to Manpreet K." },
  { id: "10422", area: "Sector 70", customer: "Simran K.", day: "Yesterday", date: "23 Sep", time: "8:40 PM", status: "Delivered", attempts: "2", note: "Delivered on 2nd attempt" },
  { id: "10418", area: "Sector 68", customer: "Vikas T.", day: "Yesterday", date: "23 Sep", time: "8:05 PM", status: "Delivered", attempts: "1", note: "On time" },
  { id: "10411", area: "Sector 71", customer: "Meena J.", day: "Yesterday", date: "23 Sep", time: "7:22 PM", status: "Cancelled", attempts: "—", note: "Cancelled by customer" },
  { id: "10402", area: "Sector 69", customer: "Deepak R.", day: "Yesterday", date: "23 Sep", time: "6:48 PM", status: "Delivered", attempts: "1", note: "On time" },
];

export const DOC_UPLOADS = [
  { key: "photo", label: "Profile photo", hint: "Clear face photo" },
  { key: "aadhaar", label: "Aadhaar card", hint: "Front side" },
  { key: "dl", label: "Driving licence", hint: "Must cover two-wheeler" },
  { key: "rc", label: "Vehicle RC", hint: "Registration certificate" },
  { key: "pan", label: "PAN card", hint: "Optional", optional: true },
];

export const APPLICATION_TIMELINE = [
  { title: "Application submitted", sub: "24 Sep, 10:12 AM" },
  { title: "Document check", sub: "In progress", current: true },
  { title: "Background & vehicle verification", sub: "After document check", pending: true },
  { title: "Approved — go online", sub: "You’ll get your zone and start taking orders", pending: true },
];

const GREEN = "bg-success/10 text-success";
const RED = "bg-destructive/10 text-destructive";
const GREY = "bg-muted text-muted-foreground";
const AMBER = "bg-amber/10 text-amber";
const VIOLET = "bg-violet/10 text-violet";
export const STATUS_STYLE = {
  New: "bg-info/10 text-info", Assigned: "bg-info/10 text-info", "Picked up": "bg-info/10 text-info",
  "Under review": AMBER, "Out for delivery": AMBER, "To check": AMBER,
  "Changes requested": VIOLET, Handover: VIOLET, Transferred: VIOLET,
  Active: GREEN, Online: GREEN, Delivered: GREEN, Verified: GREEN, Approved: GREEN,
  Offline: GREY, Cancelled: GREY,
  Suspended: RED, Failed: RED, "Not uploaded": RED, Rejected: RED, "Sent back": RED,
};
