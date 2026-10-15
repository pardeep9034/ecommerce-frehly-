import { Link } from "react-router-dom";
import StatusPill from "@/components/dashboard/StatusPill";
import TableSkeleton from "@/components/dashboard/TableSkeleton";
import { WAREHOUSE_STATUS } from "@/lib/warehouseStatus";

const HEADERS = [
  { label: "Warehouse" },
  { label: "Zone" },
  { label: "Status" },
  { label: "Manager" },
  { label: "Staff", align: "text-right" },
  { label: "Orders today", align: "text-right" },
  { label: "", srLabel: "Actions" },
];

// rows: [{ warehouse, status, zone, manager, staffCount, ordersToday }]
const WarehousesTable = ({ rows = [], isLoading }) => {
  if (isLoading) return <TableSkeleton rows={5} columns={7} />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {HEADERS.map((header) => (
              <th
                key={header.label || header.srLabel}
                scope="col"
                className={`bg-muted px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${header.align || "text-left"}`}
              >
                {header.label || <span className="sr-only">{header.srLabel}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ warehouse, status, zone, manager, staffCount, ordersToday }) => (
            <tr key={warehouse.id} className="border-t border-border">
              <td className="px-4 py-3.5">
                <span className="flex flex-col gap-0.5">
                  <span className="font-bold text-foreground">{warehouse.name}</span>
                  <span className="text-xs text-muted-foreground">{warehouse.code}</span>
                </span>
              </td>
              <td className="px-4 py-3.5 text-foreground">{zone}</td>
              <td className="px-4 py-3.5">
                <StatusPill config={WAREHOUSE_STATUS[status]} />
              </td>
              <td className="px-4 py-3.5">
                {manager ? (
                  <span className="text-foreground">{manager}</span>
                ) : (
                  <span className="font-semibold text-destructive">No manager yet</span>
                )}
              </td>
              <td className="px-4 py-3.5 text-right tabular-nums text-foreground">{staffCount}</td>
              <td className="px-4 py-3.5 text-right tabular-nums text-foreground">{ordersToday ?? "—"}</td>
              <td className="px-4 py-3.5 text-right">
                {status === "DRAFT" ? (
                  <Link
                    to={`/dashboard/warehouses/new?draft=${warehouse.id}`}
                    className="inline-flex h-9 items-center whitespace-nowrap rounded-xl bg-primary px-[18px] text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Continue setup
                  </Link>
                ) : (
                  <Link
                    to={`/dashboard/warehouses/${warehouse.id}`}
                    aria-label={`View ${warehouse.name}`}
                    className="inline-flex h-9 items-center whitespace-nowrap rounded-xl border border-border bg-white px-[18px] text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    View
                  </Link>
                )}
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={HEADERS.length} className="border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">
                No warehouses match these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default WarehousesTable;
