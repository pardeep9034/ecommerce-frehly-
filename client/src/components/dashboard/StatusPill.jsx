// Rounded status chip with a leading dot. `config` is an entry from
// WAREHOUSE_STATUS / STAFF_STATUS: { label, badge, dot }.
const StatusPill = ({ config, children }) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${config.badge}`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
    {children ?? config.label}
  </span>
);

export default StatusPill;
