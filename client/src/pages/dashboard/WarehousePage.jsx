import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import WarehousesTable from "@/components/dashboard/WarehousesTable";
import SummaryTile from "@/components/dashboard/SummaryTile";
import DemoBadge from "@/components/dashboard/DemoBadge";
import Pagination from "@/components/common/Pagination";
import useWarehouse from "@/hooks/use-warehouse";
import useDeliveryZone from "@/hooks/use-deliveryZone";
import useStaff from "@/hooks/use-staff";
import { demoOrdersToday } from "@/lib/demoData";
import { fullName } from "@/lib/staffRole";
import { WAREHOUSE_STATUS, shortWarehouseName, warehouseStatus, zoneLabel } from "@/lib/warehouseStatus";

const selectClass = "h-9 rounded-[10px] border border-border bg-white px-2.5 text-[13px] text-foreground";

const WarehousePage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { warehouses, pagination, isLoading } = useWarehouse(currentPage, 100);
  const { deliveryZonesData } = useDeliveryZone(1, 100);
  const { allStaff, isDemo: staffIsDemo } = useStaff(1, 100);
  const zones = useMemo(() => deliveryZonesData?.data?.deliveryZones ?? [], [deliveryZonesData]);

  const rows = useMemo(() => {
    const zonesById = new Map(zones.map((zone) => [String(zone.id), zone]));
    return warehouses.map((warehouse, index) => {
      const team = allStaff.filter((user) => String(user.warehouse_id) === String(warehouse.id));
      const manager = team.find((user) => user.role === "ADMIN");
      return {
        warehouse,
        status: warehouseStatus(warehouse),
        zone: zoneLabel(zonesById.get(String(warehouse.zone_id))),
        manager: manager ? fullName(manager) : null,
        staffCount: team.length,
        ordersToday: demoOrdersToday(warehouse, index),
      };
    });
  }, [warehouses, zones, allStaff]);

  const counts = useMemo(() => {
    const byStatus = (...statuses) => rows.filter((row) => statuses.includes(row.status));
    const paused = byStatus("PAUSED", "MAINTENANCE");
    return {
      live: rows.length - byStatus("DRAFT").length,
      draft: byStatus("DRAFT").length,
      open: byStatus("OPEN").length,
      paused: paused.length,
      pausedNames: paused.map((row) => shortWarehouseName(row.warehouse.name)).join(" · "),
      staff: rows.reduce((sum, row) => sum + row.staffCount, 0),
      noManager: rows.filter((row) => !row.manager).length,
    };
  }, [rows]);

  const filteredRows = rows.filter(({ warehouse, status }) => {
    if (zoneFilter && String(warehouse.zone_id) !== zoneFilter) return false;
    if (statusFilter && status !== statusFilter) return false;
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return [warehouse.name, warehouse.code, warehouse.city].some((field) => field?.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-muted-foreground">
          Stores that pick, pack and hand orders to riders. Each belongs to one delivery zone.
        </p>
        <Link
          to="/dashboard/warehouses/new"
          className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-[18px] text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add warehouse
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile
          label="Warehouses"
          value={pagination?.totalItems ?? rows.length}
          note={`${counts.live} live · ${counts.draft} setting up`}
        />
        <SummaryTile label="Open now" value={counts.open} note="Taking orders" valueClassName="text-primary" />
        <SummaryTile
          label="Paused / maintenance"
          value={counts.paused}
          note={counts.pausedNames || "None"}
          valueClassName="text-warning"
        />
        <SummaryTile
          label="Staff assigned"
          value={counts.staff}
          note={
            counts.noManager
              ? `${counts.noManager} ${counts.noManager === 1 ? "warehouse has" : "warehouses have"} no manager`
              : "Every warehouse has a manager"
          }
          valueClassName={counts.noManager ? "text-destructive" : "text-foreground"}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3.5">
          <label className="flex h-10 w-full items-center gap-2 rounded-[10px] border border-border px-3 text-muted-foreground sm:w-[300px]">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              aria-label="Search warehouses"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, code or city"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>
          <span className="flex-1" />
          <DemoBadge
            title={
              staffIsDemo
                ? "Manager, Staff and Orders today use sample data until the staff and order APIs exist."
                : "Orders today uses sample data until order-service reports per-warehouse counts."
            }
          />
          <select aria-label="Filter by zone" value={zoneFilter} onChange={(event) => setZoneFilter(event.target.value)} className={selectClass}>
            <option value="">All zones</option>
            {zones.map((zone) => (
              <option key={zone.id} value={String(zone.id)}>
                {zoneLabel(zone)}
              </option>
            ))}
          </select>
          <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={selectClass}>
            <option value="">All statuses</option>
            {Object.entries(WAREHOUSE_STATUS).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
        </div>

        <WarehousesTable rows={filteredRows} isLoading={isLoading} />
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={pagination?.totalPages ?? 0}
        totalItems={pagination?.totalItems ?? 0}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default WarehousePage;
