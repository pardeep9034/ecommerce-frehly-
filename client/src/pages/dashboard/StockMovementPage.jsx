import { Search, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MovementTable from "@/components/dashboard/MovementTable";
import Pagination from "@/components/common/Pagination";
import useStockMovement from "@/hooks/use-stockMovement";
import MovementModal from "@/components/dashboard/MovementModal";
import PageHeader from "@/components/dashboard/PageHeader";
import WarehouseApi from "@/apis/warehouseApi";
import VariantApi from "@/apis/variantApi";

const EMPTY = [];

const TYPE_FILTERS = ["All", "STOCK_IN", "SALE", "ADJUSTMENT", "DAMAGE", "RETURN"];
const TYPE_LABELS = { All: "All", STOCK_IN: "Stock in", SALE: "Sale", ADJUSTMENT: "Adjustment", DAMAGE: "Damage", RETURN: "Return" };

const StockMovementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { stockMovements, createMutation, isLoading } = useStockMovement(currentPage, 10, {
    type: typeFilter === "All" ? undefined : typeFilter,
    warehouse_id: warehouseFilter || undefined,
  });

  const movements = stockMovements?.data?.stockMovements ?? EMPTY;
  const pagination = stockMovements?.data?.pagination ?? [];

  const { data: warehousesResponse } = useQuery({
    queryKey: ["warehouses"],
    queryFn: WarehouseApi.getAllWarehouses,
  });
  const warehouses = warehousesResponse?.data?.warehouses ?? warehousesResponse?.data ?? EMPTY;
  const warehouseNames = useMemo(
    () => Object.fromEntries(warehouses.map((w) => [w.id, w.name])),
    [warehouses]
  );

  const variantIds = useMemo(() => [...new Set(movements.map((m) => m.variant_id))], [movements]);
  const { data: variantInfoResponse } = useQuery({
    queryKey: ["variantInfo", variantIds],
    queryFn: () => VariantApi.variantsInfo(variantIds),
    enabled: variantIds.length > 0,
  });
  const variantNames = useMemo(() => {
    const list = variantInfoResponse?.data ?? [];
    return Object.fromEntries(list.map((v) => [v.id, [v.product_name, v.variant_name].filter(Boolean).join(" · ")]));
  }, [variantInfoResponse]);

  // Type and warehouse are filtered by the server; search stays client-side
  // because the variant names live in product-service.
  const filteredMovements = useMemo(() => {
    if (!searchTerm) return movements;
    const term = searchTerm.toLowerCase();
    return movements.filter(
      (m) => (m.reason || "").toLowerCase().includes(term) || (variantNames[m.variant_id] || "").toLowerCase().includes(term)
    );
  }, [movements, searchTerm, variantNames]);

  const openAddModal = () => setIsModalOpen(true);

  const saveMovement = (payload) => {
    createMutation.mutate(payload);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Stock Movements"
        description="Track stock transfers and adjustments over time."
        backTo="/dashboard/inventory"
        backLabel="Back to Inventory"
        action={
          <button
            onClick={openAddModal}
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add stock
          </button>
        }
      />

      <div className="rounded-xl border border-border bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {TYPE_FILTERS.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setTypeFilter(type);
                  setCurrentPage(1);
                }}
                className={`h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
                  typeFilter === type ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-muted"
                }`}
              >
                {TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          <select
            value={warehouseFilter}
            onChange={(event) => {
              setWarehouseFilter(event.target.value);
              setCurrentPage(1);
            }}
            className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none"
          >
            <option value="">All warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <div className="ml-auto flex w-full items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5 sm:w-72">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search movements..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>

      <MovementTable movements={filteredMovements} variantNames={variantNames} warehouseNames={warehouseNames} isLoading={isLoading} />

      {searchTerm && (
        <p className="px-1 text-xs text-muted-foreground">
          Search only narrows the movements loaded on this page, not the full result set.
        </p>
      )}

      <MovementModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={saveMovement} />

      <Pagination
        currentPage={currentPage}
        totalPages={pagination?.totalPages ?? 0}
        totalItems={pagination?.totalItems ?? 0}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default StockMovementPage;
