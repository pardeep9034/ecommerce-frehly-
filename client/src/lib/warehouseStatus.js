// Store status shown on the Warehouses list, detail header and Settings tab.
// An inactive store is a draft while it is still SETTING_UP (the manager or super admin can finish setup) and
// deactivated otherwise (only the super admin can turn it back on).
export const WAREHOUSE_STATUS = {
  OPEN: { label: "Open", badge: "bg-success/10 text-success", dot: "bg-success" },
  PAUSED: { label: "Paused", badge: "bg-warning/15 text-warning", dot: "bg-warning" },
  MAINTENANCE: { label: "Maintenance", badge: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  DRAFT: { label: "Setting up", badge: "bg-blue-50 text-blue-700", dot: "bg-blue-700" },
  DEACTIVATED: { label: "Deactivated", badge: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
};

export const warehouseStatus = (warehouse) => {
  if (!warehouse?.is_active) return warehouse?.operational_status === "SETTING_UP" ? "DRAFT" : "DEACTIVATED";
  return WAREHOUSE_STATUS[warehouse.operational_status] ? warehouse.operational_status : "OPEN";
};

// Mirrors the Warehouse.operational_status enum in inventory-service. The admin Dashboard's warehouse list reads
// the raw enum value through this; the Warehouses pages use `warehouseStatus` above.
export const WAREHOUSE_STATUSES = [
  { value: "OPEN", label: "Open", style: "bg-primary/10 text-primary" },
  { value: "PAUSED", label: "Paused", style: "bg-amber/10 text-amber" },
  { value: "MAINTENANCE", label: "Maintenance", style: "bg-destructive/10 text-destructive" },
  { value: "SETTING_UP", label: "Setting up", style: "bg-info/10 text-info" },
];

export const getWarehouseStatus = (value) =>
  WAREHOUSE_STATUSES.find((status) => status.value === value) ?? WAREHOUSE_STATUSES[0];

// "Dark Store · Phase 7" -> "Phase 7", used in short labels like "Assign staff to Phase 7".
export const shortWarehouseName = (name = "") => name.split("·").pop().trim() || name;

export const zoneLabel = (zone) => (zone ? `${zone.city || zone.name} · ${zone.code}` : "—");

export const zoneOptionLabel = (zone) => `${zone.name}${zone.code ? ` (${zone.code})` : ""}`;

export const zoneCoverage = (zone) => {
  if (!zone) return "Pick a zone to see its coverage";
  const postalCount = zone.postal_codes
    ? String(zone.postal_codes).split(",").map((code) => code.trim()).filter(Boolean).length
    : 0;
  const parts = [];
  if (zone.radius_km) parts.push(`${Number(zone.radius_km)} km radius`);
  if (postalCount) parts.push(`${postalCount} postal codes`);
  return parts.join(" · ") || "No coverage set on this zone";
};
