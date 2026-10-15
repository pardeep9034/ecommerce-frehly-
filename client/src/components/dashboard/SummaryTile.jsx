// Big-number tile used across the top of the Warehouses and Staff screens.
const SummaryTile = ({ label, value, note, valueClassName = "text-foreground" }) => (
  <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-white px-5 py-[18px]">
    <span className="text-[13px] text-muted-foreground">{label}</span>
    <span className={`font-display text-[28px] font-bold leading-tight ${valueClassName}`}>{value}</span>
    {note && <span className="text-[13px] text-muted-foreground">{note}</span>}
  </div>
);

export default SummaryTile;
