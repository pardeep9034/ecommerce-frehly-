import { Search, Plus } from "lucide-react";
import { useState } from "react";
import useDeliveryZone, { useDeliveryZoneCities } from "@/hooks/use-deliveryZone";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import ZoneTable from "@/components/dashboard/ZoneTable";
import DeliveryZonePanel from "@/components/dashboard/DeliveryZonePanel";
import Pagination from "@/components/common/Pagination";
import PageHeader from "@/components/dashboard/PageHeader";

const EMPTY = [];

const Zones = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingZone, setEditingZone] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  // The server filters and pages, so a city or search covers every zone, not just the page on screen.
  const search = useDebouncedValue(searchTerm.trim());
  const { deliveryZonesData, isLoading, createMutation, updateMutation, deleteMutation } = useDeliveryZone(
    currentPage,
    10,
    { ...(cityFilter !== "All" && { city: cityFilter }), ...(search && { search }) }
  );
  const { cities } = useDeliveryZoneCities();

  const zones = deliveryZonesData?.data?.deliveryZones ?? EMPTY;
  const pagination = deliveryZonesData?.data?.pagination ?? {};

  // A new filter starts again from page 1.
  const [lastFilter, setLastFilter] = useState({ cityFilter, search });
  if (lastFilter.cityFilter !== cityFilter || lastFilter.search !== search) {
    setLastFilter({ cityFilter, search });
    setCurrentPage(1);
  }

  const saveZone = (payload) => {
    if (editingZone) {
      updateMutation.mutate({ id: editingZone.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
    setEditingZone(null);
    setShowPanel(false);
  };

  const closePanel = () => {
    setEditingZone(null);
    setShowPanel(false);
  };

  const editZone = (zone) => {
    setEditingZone(zone);
    setShowPanel(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Remove this delivery zone?")) {
      deleteMutation.mutate(id);
      if (editingZone?.id === id) closePanel();
    }
  };

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Delivery zones"
        description="Coverage areas, fees and delivery windows by pincode."
        action={
          <button
            type="button"
            onClick={() => {
              setEditingZone(null);
              setShowPanel(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add zone
          </button>
        }
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="rounded-xl border border-border bg-white p-4 shadow-card sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search zones..."
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
              <select
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                className="h-[38px] rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none"
              >
                <option value="All">All cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ZoneTable
            zones={zones}
            onEdit={editZone}
            onDelete={handleDelete}
            isLoading={isLoading}
            selectedId={showPanel ? editingZone?.id : undefined}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={pagination?.totalPages ?? 0}
            totalItems={pagination?.totalItems ?? 0}
            onPageChange={setCurrentPage}
          />
        </div>

        {showPanel && <DeliveryZonePanel zone={editingZone} onCancel={closePanel} onSave={saveZone} />}
      </div>
    </div>
  );
};

export default Zones;
