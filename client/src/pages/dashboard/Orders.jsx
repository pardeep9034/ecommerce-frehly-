import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, Search } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import OrderTable from "@/components/dashboard/OrderTable";
import Pagination from "@/components/common/Pagination";
import { toast } from "@/components/ui/sonner";
import { ORDER_STATUS_GROUPS, useAdminOrders, useOrderStats, useOrderStatusCounts } from "@/hooks/use-order";
import { DEMO_STAT_CAPTIONS } from "@/lib/orderDemoData";
import { WarehousePickerDialog, WarehouseSelect } from "@/components/dashboard/WarehousePicker";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";

const PAGE_SIZE = 10;

const Orders = () => {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [subStatus, setSubStatus] = useState(null); // one exact status inside a grouped tab
  const [page, setPage] = useState(1);
  const { warehouseId } = useSelectedWarehouse();

  // ?customer=<id> (from the Customers page's "View orders") shows only that customer's orders, across
  // every warehouse. Warehouse-wide numbers (stat cards, tab counts, picker) don't apply there.
  const [searchParams, setSearchParams] = useSearchParams();
  const customerId = searchParams.get("customer");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [tab, subStatus, search, warehouseId, customerId]);

  const activeGroup = ORDER_STATUS_GROUPS.find((group) => group.key === tab);
  const { counts, byGroup } = useOrderStatusCounts(warehouseId);
  const { stats } = useOrderStats(warehouseId);
  const hasSubStatuses = (activeGroup.statuses?.length ?? 0) > 1;
  const { orders, isLoading, pagination } = useAdminOrders({
    statuses: subStatus ? [subStatus] : activeGroup.statuses,
    page,
    limit: PAGE_SIZE,
    search,
    warehouseId: customerId ? undefined : warehouseId, // a customer's orders span warehouses, so don't also filter by the selected one
    userId: customerId || undefined,
  });

  const failedPayments = (counts.PAYMENT_FAILED || 0) + (counts.PAYMENT_EXPIRED || 0);

  const statCards = [
    {
      label: "Orders today",
      value: stats?.today.orders ?? 0,
      hint: `₹${(stats?.today.revenue ?? 0).toLocaleString("en-IN")} revenue`,
    },
    { label: "In stores now", value: byGroup.store ?? 0, hint: DEMO_STAT_CAPTIONS.store },
    { label: "With riders", value: byGroup.delivery ?? 0, hint: DEMO_STAT_CAPTIONS.delivery },
    { label: "Failed payments", value: failedPayments, hint: DEMO_STAT_CAPTIONS.payment, warn: true },
  ];

  return (
    <div className="space-y-6 lg:space-y-7">
      {!customerId && <WarehousePickerDialog />}
      <PageHeader
        title="Orders"
        description="Monitor and manage orders as they move through fulfillment."
        action={
          <button
            type="button"
            onClick={() => toast("Export isn't wired up yet")}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        }
      />

      {customerId && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-card">
          <span className="text-muted-foreground">Showing orders of customer #{customerId} only</span>
          <button
            type="button"
            onClick={() => setSearchParams({}, { replace: true })}
            className="font-medium text-primary hover:underline"
          >
            Show all orders
          </button>
        </div>
      )}

      {!customerId && (
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-border bg-white p-4 shadow-card">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className={`mt-1 font-display text-2xl font-bold ${card.warn ? "text-destructive" : "text-foreground"}`}>
                {card.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {card.hint}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {ORDER_STATUS_GROUPS.map((group) => (
              <button
                key={group.key}
                type="button"
                onClick={() => {
                  setTab(group.key);
                  setSubStatus(null);
                }}
                className={`h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
                  tab === group.key
                    ? "bg-primary text-white"
                    : "border border-border bg-white text-foreground hover:bg-muted"
                }`}
              >
                {group.label}{!customerId && ` · ${byGroup[group.key] ?? 0}`}
              </button>
            ))}
          </div>
<div className=" flex gap-3">
  
          <div className="ml-auto flex w-full items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5 sm:w-72">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by order ID or user ID..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          {!customerId && <WarehouseSelect />}
</div>
        </div>

        {hasSubStatuses && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
            {[{ key: null, label: "All", count: byGroup[tab] ?? 0 }, ...activeGroup.statuses.map((status) => ({
              key: status,
              label: status.replaceAll("_", " ").toLowerCase(),
              count: counts[status] ?? 0,
            }))].map((chip) => (
              <button
                key={chip.key ?? "all"}
                type="button"
                onClick={() => setSubStatus(chip.key)}
                aria-pressed={subStatus === chip.key}
                className={`h-7 rounded-full px-2.5 text-xs font-medium capitalize transition-colors ${
                  subStatus === chip.key
                    ? "bg-secondary text-primary"
                    : "border border-border bg-white text-muted-foreground hover:bg-muted"
                }`}
              >
                {chip.label}{!customerId && ` · ${chip.count}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <OrderTable orders={orders} isLoading={isLoading} />

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        onPageChange={setPage}
      />
    </div>
  );
};

export default Orders;
