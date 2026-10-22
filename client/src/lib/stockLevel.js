// "OUT" | "LOW" | "OK" for one inventory row, measured on what is free to sell (on the shelf minus reserved).
// Same rule as GET /inventory/summary, so the Overview card, the Inventory page and the store stock page agree.
export const stockLevel = (item) => {
  const available = (item.current_stock ?? 0) - (item.reserved_stock ?? 0);
  if (available <= 0) return "OUT";
  return available <= (item.low_stock_threshold ?? 10) ? "LOW" : "OK";
};
