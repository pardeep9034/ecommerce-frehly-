// Shared status pill for delivery assignments — mirrors the STATUS_STYLES
// map in components/dashboard/OrderTable.jsx, scoped to the assignment
// lifecycle instead of the order lifecycle.
const STATUS_STYLES = {
  ACTIVE: "bg-primary/10 text-primary",
  ASSIGNED: "bg-warning/10 text-warning-foreground",
  PICKED_UP: "bg-primary/10 text-primary",
  OUT_FOR_DELIVERY: "bg-success/10 text-success",
  DELIVERED: "bg-success/10 text-success",
  COMPLETED: "bg-success/10 text-success",
  DELIVERY_FAILED: "bg-destructive/10 text-destructive",
  FAILED: "bg-destructive/10 text-destructive",
  TRANSFERRED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${
      STATUS_STYLES[status] || "bg-muted text-muted-foreground"
    }`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status?.replace(/_/g, " ") || "—"}
  </span>
);

export default StatusBadge;
