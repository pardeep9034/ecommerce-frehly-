// Fabricated / demo values only. No real picker or rider data exists in
// order-service yet — see ADMIN_PANEL_REDESIGN.md.
// Picks are deterministic per id so the same order always shows the same
// fake facts instead of flickering between renders.

const DEMO_WAREHOUSES = ["Phase 7 Dark Store", "Zirakpur Dark Store", "Sector 35 Dark Store"];
const DEMO_PICKERS = ["Suresh B.", "Kiran Patel", "Amit Rana"];
const DEMO_RIDERS = ["Ravi Kumar", "Manpreet Singh", "Deepak Yadav"];

const pick = (list, seed) => list[Math.abs(Number(seed) || 0) % list.length];

export const getDemoPhone = (userId) => {
  const last4 = String(1000 + (Math.abs(Number(userId) || 0) % 9000));
  return `+91 98•••• ${last4}`;
};

export const DEMO_WAREHOUSE_OPTIONS = DEMO_WAREHOUSES;

export const getDemoFulfilment = (orderId) => ({
  warehouse: pick(DEMO_WAREHOUSES, orderId),
  picker: pick(DEMO_PICKERS, orderId),
  rider: pick(DEMO_RIDERS, orderId + 1),
});

// The design's own sample numbers — there's no date-scoped order count or
// revenue aggregate endpoint to compute these for real yet.
export const DEMO_ORDERS_TODAY = { count: 581, revenue: "₹58,240 revenue" };

export const DEMO_STAT_CAPTIONS = {
  store: "New, picking, packing, ready",
  delivery: "Avg 14 min to door",
  payment: "Retry link sent",
};
