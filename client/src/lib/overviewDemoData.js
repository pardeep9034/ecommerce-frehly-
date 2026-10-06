// Fabricated / demo values for the Overview dashboard. No revenue, delivery-time,
// cancellation, per-day order-volume, warehouse-ops, delivery-partner, or
// staff-lockout aggregate exists in any service yet — see BACKEND_REQUIREMENTS.md.

export const OVERVIEW_STATS = {
  revenueToday: "₹58,240",
  revenueChangeHint: "+12% vs last Thursday",
  ordersTodayHint: "142 in the 7–9 AM slot",
  avgDeliveryMinutes: 34,
  avgDeliveryHint: "Target 40 min",
  cancelledPct: "2.1%",
  cancelledHint: "12 orders · 5 by customer",
};

export const ORDERS_PER_DAY_7 = [
  { day: "Fri", orders: 380 },
  { day: "Sat", orders: 520 },
  { day: "Sun", orders: 610 },
  { day: "Mon", orders: 440 },
  { day: "Tue", orders: 470 },
  { day: "Wed", orders: 550 },
  { day: "Thu", orders: 580 },
];

// No real 30-day history to sample, so this is a smooth deterministic wave
// rather than 30 hand-picked numbers.
export const ORDERS_PER_DAY_30 = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  orders: Math.round(480 + 140 * Math.sin(i / 2.3)),
}));

export const NEEDS_ATTENTION_DEMO = {
  partnerApplications: 7,
  lowStockItems: 18,
  lockedStaffAccounts: 1,
};
