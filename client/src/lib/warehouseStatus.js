// Mirrors the Warehouse.operational_status enum in inventory-service.
export const WAREHOUSE_STATUSES = [
  { value: "OPEN", label: "Open", style: "bg-primary/10 text-primary" },
  { value: "PAUSED", label: "Paused", style: "bg-amber/10 text-amber" },
  { value: "MAINTENANCE", label: "Maintenance", style: "bg-destructive/10 text-destructive" },
  { value: "SETTING_UP", label: "Setting up", style: "bg-info/10 text-info" },
];

export const getWarehouseStatus = (value) =>
  WAREHOUSE_STATUSES.find((status) => status.value === value) ?? WAREHOUSE_STATUSES[0];
