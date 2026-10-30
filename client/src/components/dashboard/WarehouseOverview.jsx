import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import SummaryTile from "@/components/dashboard/SummaryTile";
import InventoryApi from "@/apis/inventoryApi";
import StoreApi from "@/apis/storeApi";
import { useOrderStats } from "@/hooks/use-order";
import { useStoreQueue } from "@/hooks/use-store";
import { usePartners } from "@/hooks/use-delivery";
import { STAGES, deriveStage } from "@/lib/orderStage";
import { DEFAULT_PACK_BY_MINUTES } from "@/lib/warehouseForm";
import { zoneLabel } from "@/lib/warehouseStatus";
import { cardClass } from "@/lib/formStyles";

// The store's own stages; not-delivered and cancelled orders are on the Returns and Orders pages.
const PIPELINE = STAGES.filter((stage) => stage.key !== "RETURN" && stage.key !== "CANCELLED");
// Stages where the store still owes the bag. WAITING is on the customer, so it never counts as late.
const UNPACKED = new Set(["NEW", "PICKING", "PACKING"]);
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

// The detail page's Overview tab. Every number comes from an existing API: order stats (today), the store board's
// open-orders query, the zone's online riders, the stock summary and the two returns lists. `members` and `manager`
// are the page's team, already loaded.
const WarehouseOverview = ({ warehouse, zone, members, manager }) => {
  const warehouseId = warehouse.id;
  const packBy = warehouse.pack_by_minutes ?? DEFAULT_PACK_BY_MINUTES;

  const { stats } = useOrderStats(warehouseId, 1);
  const { orders, isLoading: queueLoading } = useStoreQueue(warehouseId);
  const { pagination: riders } = usePartners({ zone_id: warehouse.zone_id, online: "true", status: "ACTIVE", limit: 1 });
  const { data: stock } = useQuery({
    queryKey: ["inventory", "summary", String(warehouseId)],
    queryFn: () => InventoryApi.fetchStockSummary(warehouseId),
  });
  const { data: toReview } = useQuery({
    queryKey: ["store-returns", "REQUESTED", String(warehouseId)],
    queryFn: () => StoreApi.getReturns("REQUESTED", warehouseId),
    select: (response) => response?.data || [],
    refetchInterval: 60000,
  });
  const { data: due } = useQuery({
    queryKey: ["store-returns-due"],
    queryFn: () => StoreApi.getReturnsDue(),
    select: (response) => (response?.data || []).filter((row) => String(row.warehouse_id) === String(warehouseId)),
    refetchInterval: 60000,
  });

  const now = Date.now();
  const staged = orders.map((order) => ({ order, stage: deriveStage(order) }));
  const counts = Object.fromEntries(PIPELINE.map((stage) => [stage.key, staged.filter((row) => row.stage === stage.key).length]));
  const open = PIPELINE.reduce((sum, stage) => sum + counts[stage.key], 0);
  const late = staged.filter(({ order, stage }) => {
    const placed = new Date(order.placed_at || order.created_at).getTime();
    return UNPACKED.has(stage) && now - placed > packBy * 60000;
  }).length;
  const idle = members.filter((user) => !user.last_login_at || now - new Date(user.last_login_at).getTime() > TWO_DAYS_MS);
  const short = (stock?.low ?? 0) + (stock?.out ?? 0);
  const overdue = (due || []).filter((row) => row.overdue).length;

  const attention = [
    late > 0 && { text: `${plural(late, "order")} past the ${packBy}-min pack-by time`, to: "/admin/orders" },
    !manager && { text: "No store manager assigned" },
    short > 0 && {
      text: [stock.out && `${plural(stock.out, "product")} out of stock`, stock.low && `${stock.low} running low`].filter(Boolean).join(", "),
      to: "/admin/inventory",
    },
    toReview?.length > 0 && { text: `${plural(toReview.length, "customer return")} waiting for review`, to: "/admin/returns" },
    due?.length > 0 && {
      text: `${plural(due.length, "rider")} still holding goods for this store${overdue ? ` (${overdue} overdue)` : ""}`,
      to: "/admin/returns",
    },
    idle.length > 0 && { text: `${plural(idle.length, "team member")} not signed in for 2+ days` },
  ].filter(Boolean);

  const dash = (value, suffix = "") => (value === null || value === undefined ? "—" : `${value}${suffix}`);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-base font-bold text-foreground">Today</h2>
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <SummaryTile label="Orders today" value={dash(stats?.today.orders)} note={stats ? `${stats.today.cancelled} cancelled` : undefined} />
        <SummaryTile label="Avg pick + pack" value={dash(stats?.avgPackMinutesToday, " min")} note={`Target ${packBy} min`} />
        <SummaryTile
          label="Late to pack"
          value={queueLoading ? "—" : late}
          valueClassName={late ? "text-destructive" : "text-foreground"}
          note="Past the pack-by time"
        />
        <SummaryTile
          label="Riders online"
          value={warehouse.zone_id ? dash(riders?.totalItems) : "—"}
          note={zone ? `In ${zoneLabel(zone)}` : "No delivery zone"}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <section className={cardClass}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-bold text-foreground">Orders in the store now</h2>
            <span className="text-[13px] text-muted-foreground">{queueLoading ? "Loading…" : `${open} open`}</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
            {PIPELINE.map((stage) => (
              <div key={stage.key} className="flex flex-col items-center gap-1 rounded-xl bg-muted px-2 py-3 text-center">
                <span className="font-display text-2xl font-bold text-foreground">{queueLoading ? "—" : counts[stage.key]}</span>
                <span className="text-xs text-muted-foreground">{stage.label}</span>
              </div>
            ))}
          </div>
        </section>
        <section className={cardClass}>
          <h2 className="font-display text-base font-bold text-foreground">Needs attention</h2>
          {attention.length === 0 ? (
            <p className="flex gap-2.5 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              Nothing right now.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {attention.map((item) => (
                <li key={item.text} className="flex gap-2.5 text-sm text-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                  {item.to ? (
                    <Link to={item.to} className="hover:text-primary hover:underline">{item.text}</Link>
                  ) : (
                    item.text
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default WarehouseOverview;
