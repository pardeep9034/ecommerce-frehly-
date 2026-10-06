import { Search, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import UnitsTable from "@/components/dashboard/UnitsTable";
import useUnits from "@/hooks/use-units";
import UnitsModal from "@/components/dashboard/UnitsModal";
import Pagination from "@/components/common/Pagination";
import PageHeader from "@/components/dashboard/PageHeader";

const EMPTY = [];

const PAGE_SIZE = 10;
const CATEGORY_FILTERS = ["All", "WEIGHT", "VOLUME", "COUNT", "PACKAGING"];

const UnitsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
    const [showPanel, setShowPanel] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
      const [currentPage, setCurrentPage] = useState(1);
      const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchTerm.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  const { unitsData,createMutation,updateMutation,deleteMutation,isLoading } = useUnits(currentPage,PAGE_SIZE,{
    search,
    category: categoryFilter === "All" ? undefined : categoryFilter,
  });

  const units = unitsData?.data?.units ?? EMPTY;
  const pagination=unitsData?.data?.pagination??{};


  const closePanel = () => {
    setEditingUnit(null);
    setShowPanel(false);
  };

  const openAddPanel = () => {
    setEditingUnit(null);
    setShowPanel(true);
  };

  const openEditPanel = (unit) => {
    setEditingUnit(unit);
    setShowPanel(true);
  };
  const saveUnit = (payload) => {
    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
    closePanel();
  };
    const handleDelete = (unitId) => {
    deleteMutation.mutate(unitId);
    if (editingUnit?.id === unitId) closePanel();
  };

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Units"
        description="Define measurement units used across product variants."
        backTo="/dashboard/products"
        backLabel="Back to Products"
        action={
          <button
            onClick={openAddPanel}
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Unit
          </button>
        }
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="rounded-xl border border-border bg-white p-4 shadow-card sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5">
                <Search className="h-4 w-4 text-muted-foreground" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                  }}
                  placeholder="Search units..."
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {CATEGORY_FILTERS.map((category) => (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={categoryFilter === category}
                    onClick={() => setCategoryFilter(category)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      categoryFilter === category
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {category === "All" ? "All" : category.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <UnitsTable
            units={units}
            onEdit={openEditPanel}
            onDelete={handleDelete}
            isLoading={isLoading}
            selectedId={showPanel ? editingUnit?.id : undefined}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={pagination?.totalPages ?? 0}
            totalItems={pagination?.totalItems ?? 0}
            onPageChange={setCurrentPage}
          />
        </div>

        {showPanel && <UnitsModal unit={editingUnit} onCancel={closePanel} onSave={saveUnit} />}
      </div>
    </div>
  );
};

export default UnitsPage;
