import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Package, CreditCard, Lock } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { WarehouseSelect } from "@/components/dashboard/WarehousePicker";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { StatusBadge } from "@/components/dashboard/OrderTable";
import { useAdminOrders, useOrderStats, useOrderStatusCounts } from "@/hooks/use-order";
import useWarehouse from "@/hooks/use-warehouse";
import { usePartnerSummary } from "@/hooks/use-partnerReview";
import { useQuery } from "@tanstack/react-query";
import staffApi from "@/apis/staffApi";
import { getToken, getTokenRole } from "@/lib/tokenStorage";
import InventoryApi from "@/apis/inventoryApi";
import { getWarehouseStatus } from "@/lib/warehouseStatus";

const Dashboard = () => {
  const [chartRange, setChartRange] = useState("7");
  const { warehouseId } = useSelectedWarehouse();

  const { counts, byGroup, isLoading: countsLoading } = useOrderStatusCounts(warehouseId);
  const { stats } = useOrderStats(warehouseId, Number(chartRange));
  const { orders: latestOrders, isLoading: ordersLoading } = useAdminOrders({ statuses: null, page: 1, limit: 5, warehouseId });
  const { warehouses, isLoading: warehousesLoading } = useWarehouse(1, 5);
  const { summary } = usePartnerSummary();
  // Staff accounts are super-admin only (the API 403s for anyone else), so the row is hidden for other roles.
  const isSuperAdmin = getTokenRole(getToken()) === "SUPER_ADMIN";
  const { data: staffData } = useQuery({
    queryKey: ["staff", 1, 1, {}],
    queryFn: () => staffApi.getAllStaff(1, 1),
    enabled: isSuperAdmin,
  });
  const staffSummary = staffData?.data?.summary;
  // Each product short in each warehouse counts once per warehouse; follows the warehouse picker (empty = all).
  const { data: stockSummary } = useQuery({
    queryKey: ["inventory", "summary", warehouseId],
    queryFn: () => InventoryApi.fetchStockSummary(warehouseId),
  });

  const statusPills = [
    {
      label: "Awaiting payment",
      value: (counts.PENDING_PAYMENT || 0) + (counts.PAYMENT_FAILED || 0) + (counts.PAYMENT_EXPIRED || 0),
      tone: "text-amber",
    },
    { label: "New", value: counts.PLACED || 0, tone: "text-info" },
    { label: "Confirmed", value: counts.CONFIRMED || 0, tone: "text-teal" },
    { label: "Waiting on customer", value: counts.AWAITING_CUSTOMER_CONFIRMATION || 0, tone: "text-violet" },
    { label: "Ready for pickup", value: counts.READY_FOR_ASSIGNMENT || 0, tone: "text-primary" },
    { label: "With rider", value: byGroup.delivery || 0, tone: "text-info" },
  ];

  const chartData = useMemo(
    () =>
      (stats?.perDay ?? []).map((row) => ({
        day: new Date(`${row.date}T00:00:00`).toLocaleDateString("en-US", chartRange === "7" ? { weekday: "short" } : { day: "numeric", month: "short" }),
        orders: row.orders,
      })),
    [stats, chartRange]
  );

  const today = stats?.today ?? { orders: 0, revenue: 0, cancelled: 0 };
  const yesterday = stats?.perDay?.[stats.perDay.length - 2];
  const vsYesterday = (now, before) => (before === undefined ? "" : `${now - before >= 0 ? "+" : ""}${now - before} vs yesterday`);
  const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const failedPayments = (counts.PAYMENT_FAILED || 0) + (counts.PAYMENT_EXPIRED || 0);

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Overview"
        description="A snapshot of today's sales, orders and stock health."
        action={<WarehouseSelect />}
      />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-white p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Revenue today</p>
          <p className="mt-1 font-display text-2xl font-bold text-primary">{money(today.revenue)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{yesterday ? `${money(yesterday.revenue)} yesterday` : "Paid orders, net of refunds"}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Orders today</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{today.orders}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{vsYesterday(today.orders, yesterday?.orders) || "Placed today"}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Avg. order to door</p>
          <p className="mt-1 font-display text-2xl font-bold text-primary">{stats?.avgDeliveryMinutes != null ? `${stats.avgDeliveryMinutes} min` : "—"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Pickup to delivered · last {chartRange} days</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Cancelled</p>
          <p className="mt-1 font-display text-2xl font-bold text-destructive">{stats?.cancelRate != null ? `${stats.cancelRate}%` : "—"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Last {chartRange} days · {today.cancelled} today</p>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-card">
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold text-foreground">{warehouseId ? "Live orders" : "Live orders across all warehouses"}</h2>
          <Link to="/admin/orders" className="text-sm font-semibold text-primary hover:underline">
            Open orders board
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {statusPills.map((pill) => (
            <Link
              key={pill.label}
              to="/admin/orders"
              className="flex flex-col gap-1 rounded-xl bg-muted p-3 transition-colors hover:bg-secondary"
            >
              <span className={`font-display text-xl font-bold ${pill.tone}`}>{countsLoading ? "…" : pill.value}</span>
              <span className="text-xs text-muted-foreground">{pill.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr_1fr]">
        <section className="rounded-2xl border border-border bg-white p-5 shadow-card">
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-foreground">Orders per day</h2>
            <div role="group" className="flex gap-1.5">
              {["7", "30"].map((range) => (
                <button
                  key={range}
                  type="button"
                  aria-pressed={chartRange === range}
                  onClick={() => setChartRange(range)}
                  className={`h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
                    chartRange === range ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-muted"
                  }`}
                >
                  {range} days
                </button>
              ))}
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval={chartRange === "30" ? 4 : 0} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "13px" }}
                />
                <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-foreground">Warehouses</h2>
            <Link to="/admin/warehouses" className="text-sm font-semibold text-primary hover:underline">
              Manage
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {warehousesLoading && <li className="py-2.5 text-sm text-muted-foreground">Loading…</li>}
            {!warehousesLoading && warehouses.length === 0 && (
              <li className="py-2.5 text-sm text-muted-foreground">No warehouses yet.</li>
            )}
            {warehouses.map((warehouse) => {
              const status = getWarehouseStatus(warehouse.operational_status);
              return (
                <li key={warehouse.id} className="flex items-center gap-2.5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{warehouse.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{warehouse.city || "—"}</p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${status.style}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {status.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-card">
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">Needs attention</h2>
          <div className="flex flex-col gap-2">
            <Link to="/admin/delivery-partners" className="flex items-center gap-2.5 rounded-lg bg-violet/10 px-3 py-2.5 text-violet">
              <Users className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-sm text-foreground">Partner applications to review</span>
              <strong className="text-sm">{summary ? summary.waiting : "…"}</strong>
            </Link>
            <Link to="/admin/inventory" className="flex items-center gap-2.5 rounded-lg bg-amber/10 px-3 py-2.5 text-amber">
              <Package className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-sm text-foreground">Items low or out of stock</span>
              <strong className="text-sm">{stockSummary ? stockSummary.low + stockSummary.out : "…"}</strong>
            </Link>
            <Link to="/admin/orders" className="flex items-center gap-2.5 rounded-lg bg-destructive/10 px-3 py-2.5 text-destructive">
              <CreditCard className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-sm text-foreground">Payments failed</span>
              <strong className="text-sm">{countsLoading ? "…" : failedPayments}</strong>
            </Link>
            {isSuperAdmin && (
              <Link to="/admin/staff" className="flex items-center gap-2.5 rounded-lg bg-destructive/10 px-3 py-2.5 text-destructive">
                <Lock className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-sm text-foreground">Locked staff accounts</span>
                <strong className="text-sm">{staffSummary ? staffSummary.locked : "…"}</strong>
              </Link>
            )}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-card">
        <div className="flex items-center justify-between gap-3 px-5 py-3.5">
          <h2 className="font-display text-base font-semibold text-foreground">Latest orders</h2>
          <Link to="/admin/orders" className="text-sm font-semibold text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-border bg-muted">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Order</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Customer</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Warehouse</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {latestOrders.map((order) => (
                <tr key={order.id} className="border-t border-border transition-colors hover:bg-muted">
                  <td className="px-5 py-3.5">
                    <Link to={`/admin/orders/${order.id}`} className="font-medium text-primary hover:underline">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-foreground">{order.address?.full_name || `Customer #${order.user_id}`}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{warehouses.find((warehouse) => String(warehouse.id) === String(order.warehouse_id))?.name ?? (order.warehouse_id ? `#${order.warehouse_id}` : "—")}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-foreground">₹{Number(order.total_amount).toFixed(2)}</td>
                </tr>
              ))}
              {!ordersLoading && latestOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                    {warehouseId ? "No orders yet." : "Select a warehouse to see its orders."}
                  </td>
                </tr>
              )}
              {ordersLoading && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
