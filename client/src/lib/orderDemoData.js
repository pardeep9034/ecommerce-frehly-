// Fabricated / demo values only — see ADMIN_PANEL_REDESIGN.md.
// Picks are deterministic per id so the same order always shows the same
// fake facts instead of flickering between renders.

const DEMO_WAREHOUSES = ["Phase 7 Dark Store", "Zirakpur Dark Store", "Sector 35 Dark Store"];

export const getDemoPhone = (userId) => {
  const last4 = String(1000 + (Math.abs(Number(userId) || 0) % 9000));
  return `+91 98•••• ${last4}`;
};

export const DEMO_WAREHOUSE_OPTIONS = DEMO_WAREHOUSES;

// The design's own sample numbers — there's no date-scoped order count or
// revenue aggregate endpoint to compute these for real yet.
export const DEMO_ORDERS_TODAY = { count: 581, revenue: "₹58,240 revenue" };

export const DEMO_STAT_CAPTIONS = {
  store: "New, picking, packing, ready",
  delivery: "Avg 14 min to door",
  payment: "Retry link sent",
};
