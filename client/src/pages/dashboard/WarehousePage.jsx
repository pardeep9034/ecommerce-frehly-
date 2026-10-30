import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import WarehousesTable from "@/components/dashboard/WarehousesTable";
import SummaryTile from "@/components/dashboard/SummaryTile";
import DemoBadge from "@/components/dashboard/DemoBadge";
import Pagination from "@/components/common/Pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useWarehouse, { useWarehouseCities } from "@/hooks/use-warehouse";
import useDeliveryZone from "@/hooks/use-deliveryZone";
import useStaff from "@/hooks/use-staff";
import { fullName } from "@/lib/staffRole";
import { WAREHOUSE_STATUS, shortWarehouseName, warehouseStatus, zoneLabel } from "@/lib/warehouseStatus";
import { currentStaff } from "@/lib/warehouseAccess";

// The same Select as the Products filters. Radix items can't have an empty value, so "All" stands for "" (no filter).
const FilterSelect = ({ label, allLabel, value, onChange, options }) => (
  <Select value={value || "All"} onValueChange={(next) => onChange(next === "All" ? "" : next)}>
    <SelectTrigger className="w-auto min-w-37.5 py-2.5" aria-label={label}>
      <SelectValue>{options.find((option) => option.value === value)?.label ?? allLabel}</SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="All">{allLabel}</SelectItem>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

// Only the super admin sees every store; a store manager or store staff goes straight to their own.
const WarehousePage = () => {
  const { isSuperAdmin, ownWarehouseId } = currentStaff();
  if (isSuperAdmin) return <WarehouseList />;
  if (ownWarehouseId) return <Navigate to={`/admin/warehouses/${ownWarehouseId}`} replace />;
  return <p className="text-sm text-muted-foreground">No store is assigned to your account yet. Ask the super admin to assign you to one.</p>;
};

const WarehouseList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  // City is filtered by the server (it covers every warehouse); the tiles below then count that city's stores.
  const { warehouses, pagination, isLoading } = useWarehouse(currentPage, 100, cityFilter ? { city: cityFilter } : {});
  const { cities } = useWarehouseCities();
  const { deliveryZonesData } = useDeliveryZone(1, 100);
  const { allStaff, isDemo: staffIsDemo } = useStaff(1, 100);
  const zones = useMemo(() => deliveryZonesData?.data?.deliveryZones ?? [], [deliveryZonesData]);

  const rows = useMemo(() => {
    const zonesById = new Map(zones.map((zone) => [String(zone.id), zone]));
    return warehouses.map((warehouse) => {
      const team = allStaff.filter((user) => String(user.warehouse_id) === String(warehouse.id));
      const manager = team.find((user) => user.role === "ADMIN");
      return {
        warehouse,
        status: warehouseStatus(warehouse),
        zone: zoneLabel(zonesById.get(String(warehouse.zone_id))),
        manager: manager ? fullName(manager) : null,
        staffCount: team.length,
      };
    });
  }, [warehouses, zones, allStaff]);

  const counts = useMemo(() => {
    const byStatus = (...statuses) => rows.filter((row) => statuses.includes(row.status));
    const paused = byStatus("PAUSED", "MAINTENANCE");
    return {
      live: rows.length - byStatus("DRAFT", "DEACTIVATED").length,
      draft: byStatus("DRAFT").length,
      deactivated: byStatus("DEACTIVATED").length,
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
          to="/admin/warehouses/new"
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
          note={`${counts.live} live · ${counts.draft} setting up${counts.deactivated ? ` · ${counts.deactivated} deactivated` : ""}`}
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
          {staffIsDemo && <DemoBadge title="Manager and Staff use sample people until the staff API answers." />}
          <FilterSelect
            label="Filter by city"
            allLabel="All cities"
            value={cityFilter}
            onChange={(city) => {
              setCityFilter(city);
              setCurrentPage(1);
            }}
            options={cities.map((city) => ({ value: city, label: city }))}
          />
          <FilterSelect
            label="Filter by zone"
            allLabel="All zones"
            value={zoneFilter}
            onChange={setZoneFilter}
            options={zones.map((zone) => ({ value: String(zone.id), label: zoneLabel(zone) }))}
          />
          <FilterSelect
            label="Filter by status"
            allLabel="All statuses"
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(WAREHOUSE_STATUS).map(([value, config]) => ({ value, label: config.label }))}
          />
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
