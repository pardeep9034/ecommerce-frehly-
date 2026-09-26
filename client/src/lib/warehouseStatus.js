// Store status shown on the Warehouses list, detail header and Settings tab.
// `operational_status` is not on the Warehouse model yet (see
// ADMIN_WAREHOUSES_STAFF_MODULE.md, backend change #5). Until it ships, an active
// warehouse reads as OPEN and an inactive one as DRAFT ("Setting up").
export const WAREHOUSE_STATUS = {
  OPEN: { label: "Open", badge: "bg-success/10 text-success", dot: "bg-success" },
  PAUSED: { label: "Paused", badge: "bg-warning/15 text-warning", dot: "bg-warning" },
  MAINTENANCE: { label: "Maintenance", badge: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  DRAFT: { label: "Setting up", badge: "bg-blue-50 text-blue-700", dot: "bg-blue-700" },
};

export const warehouseStatus = (warehouse) => {
  if (!warehouse?.is_active) return "DRAFT";
  return WAREHOUSE_STATUS[warehouse.operational_status] ? warehouse.operational_status : "OPEN";
};

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
