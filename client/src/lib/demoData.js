// Demo data for the Warehouses & Staff screens, taken from the design canvas.
// Shown only where the backend has nothing yet (see ADMIN_WAREHOUSES_STAFF_MODULE.md):
// the /auth/admin/users and /warehouses/:id/team|settings endpoints, and per-store
// order/rider metrics. Every screen that shows it says so with a "Demo data" note.

export const DEMO_NOTICE = "Demo data: this needs the backend API before changes can be saved.";

// The endpoint doesn't exist yet (404) or the gateway can't reach the service.
export const isApiMissing = (error) => Boolean(error) && (!error.response || error.response.status === 404);

// Don't retry a missing endpoint 3 times before falling back to demo data.
export const retryUnlessMissing = (failureCount, error) => !isApiMissing(error) && failureCount < 3;

const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

// `warehouse_slot` pins each demo user to the Nth real warehouse (see use-staff.js),
// so the list, detail and assign screens agree with each other.
export const DEMO_STAFF = [
  { id: -1, first_name: "Priya", last_name: "Sharma", phone: "+91 98760 11001", role: "SUPER_ADMIN", warehouse_slot: null, is_active: true, last_login_at: minutesAgo(2) },
  { id: -2, first_name: "Vikram", last_name: "Singh", phone: "+91 98140 55210", role: "SUPER_ADMIN", warehouse_slot: null, is_active: true, last_login_at: minutesAgo(60) },
  { id: -3, first_name: "Suresh", last_name: "Bansal", phone: "+91 98150 12345", role: "ADMIN", warehouse_slot: 0, is_active: true, last_login_at: minutesAgo(5), on_shift: true },
  { id: -4, first_name: "Neha", last_name: "Gupta", phone: "+91 99880 22417", role: "ADMIN", warehouse_slot: 1, is_active: true, last_login_at: minutesAgo(200) },
  { id: -5, first_name: "Jasleen", last_name: "Kaur", phone: "+91 97790 44120", role: "ADMIN", warehouse_slot: null, is_active: true, last_login_at: minutesAgo(1500) },
  { id: -6, first_name: "Amandeep", last_name: "Kaur", phone: "+91 98722 30114", role: "OPS_STAFF", warehouse_slot: 0, is_active: true, last_login_at: minutesAgo(90), on_shift: true },
  { id: -7, first_name: "Mohit", last_name: "Rana", phone: "+91 99140 88210", role: "OPS_STAFF", warehouse_slot: 0, is_active: true, last_login_at: minutesAgo(150), on_shift: true },
  { id: -8, first_name: "Pooja", last_name: "Saini", phone: "+91 97790 11402", role: "OPS_STAFF", warehouse_slot: 0, is_active: true, last_login_at: minutesAgo(2900) },
  { id: -9, first_name: "Karan", last_name: "Dhillon", phone: "+91 98555 70231", role: "OPS_STAFF", warehouse_slot: 0, is_active: true, last_login_at: minutesAgo(1500) },
  { id: -10, first_name: "Rohit", last_name: "Sharma", phone: "+91 97800 11223", role: "OPS_STAFF", warehouse_slot: 1, is_active: true, must_change_password: true, last_login_at: null },
  { id: -11, first_name: "Tanya", last_name: "Kapoor", phone: "+91 98880 41290", role: "OPS_STAFF", warehouse_slot: 1, is_active: true, last_login_at: minutesAgo(400), on_shift: true },
  { id: -12, first_name: "Harpreet", last_name: "Singh", phone: "+91 98550 66102", role: "OPS_STAFF", warehouse_slot: 2, is_active: true, failed_login_attempts: 3, account_locked_until: minutesAgo(-60), last_login_at: minutesAgo(4000) },
  { id: -13, first_name: "Deepak", last_name: "Verma", phone: "+91 99150 70344", role: "OPS_STAFF", warehouse_slot: 3, is_active: false, last_login_at: "2026-09-12T09:00:00Z" },
  { id: -14, first_name: "Gurpreet", last_name: "Singh", phone: "+91 98720 60311", role: "OPS_STAFF", warehouse_slot: null, is_active: true, last_login_at: null },
  { id: -15, first_name: "Manish", last_name: "Rawat", phone: "+91 99888 20145", role: "OPS_STAFF", warehouse_slot: null, is_active: true, last_login_at: null },
];

// Per-store live numbers (orders, pick/pack time, riders). No service aggregates these yet.
const DEMO_ORDERS_TODAY = [142, 96, 58, 0];

export const demoOrdersToday = (warehouse, index) =>
  warehouse?.is_active ? DEMO_ORDERS_TODAY[index % DEMO_ORDERS_TODAY.length] : null;

export const DEMO_WAREHOUSE_METRICS = {
  ordersToday: 142,
  slotNote: "Slot 7–9 AM: 14",
  avgPickPack: "9 min",
  pickPackTarget: "Target 10 min",
  lateToPack: 3,
  ridersOnline: 18,
  pipeline: [
    { label: "New", count: 3 },
    { label: "Picking", count: 2 },
    { label: "Waiting", count: 1 },
    { label: "Packing", count: 2 },
    { label: "Ready", count: 1 },
    { label: "Rider assigned", count: 2 },
  ],
  openOrders: 14,
  attention: [
    "#10495 cancelled after picking · 6 items to put back",
    "2 products low on stock · 1 out of stock",
    "Pooja Saini hasn’t logged in for 2 days",
  ],
};

export const DEMO_LABEL_PRINTER = "Bluetooth · connected";

export const SHIFT_OPTIONS = [
  { value: "MORNING", label: "Morning · 6 AM – 2 PM" },
  { value: "EVENING", label: "Evening · 2 PM – 10 PM" },
  { value: "NIGHT", label: "Night · 10 PM – 6 AM" },
];
