import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import WarehouseApi from "@/apis/warehouseApi";
import InventoryApi from "@/apis/inventoryApi";
import SearchableSelector from "@/components/common/SearchableSelector";

const getWarehouses = (response) => {
  const data = response?.data ?? response;
  return Array.isArray(data) ? data : data?.warehouses ?? data?.rows ?? [];
};

const getStock = (response) => {
  const data = response?.data ?? response;
  return Array.isArray(data) ? data[0] : data;
};

const StockModal = ({ open, onClose, variantId }) => {
  const [warehouseId, setWarehouseId] = useState("");

  useEffect(() => {
    if (open) setWarehouseId("");
  }, [open, variantId]);

  const warehousesQuery = useQuery({
    queryKey: ["warehouses"],
    queryFn: WarehouseApi.getAllWarehouses,
    enabled: open,
  });

  const stockQuery = useQuery({
    queryKey: ["variant-stock", variantId, warehouseId],
    queryFn: () => InventoryApi.fetchVariantStock(variantId, warehouseId),
    enabled: open && Boolean(variantId) && Boolean(warehouseId),
    retry: (failureCount, error) => error?.response?.status !== 404 && failureCount < 2,
  });

  const warehouses = useMemo(() => getWarehouses(warehousesQuery.data), [warehousesQuery.data]);
  const stock = getStock(stockQuery.data);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-white shadow-card" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-5 sm:px-7">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Variant Stock</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Variant ID: {variantId}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close stock modal" className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="text-sm font-medium text-foreground">Warehouse</label>
            <SearchableSelector
              data={warehouses}
              labelKey="name"
              valueKey="id"
              onSelect={(id) => setWarehouseId(id)}
              placeholder={warehousesQuery.isLoading ? "Loading warehouses..." : "Search and select a warehouse"}
              disabled={warehousesQuery.isLoading}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-500"
            />
            {warehousesQuery.isError && <p className="mt-1 text-xs text-destructive">Unable to load warehouses.</p>}
          </div>

          {!warehouseId && <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">Select a warehouse to view this variant’s stock.</p>}
          {stockQuery.isLoading && <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">Loading stock…</p>}
          {stockQuery.isError && (
            <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {stockQuery.error?.response?.status === 404
                ? "No inventory record for this variant in this warehouse."
                : "Unable to load stock for this warehouse."}
            </p>
          )}
          {warehouseId && stockQuery.isSuccess && (
            <div className="grid grid-cols-3 gap-3">
              <StockItem label="Stock" value={stock?.current_stock ?? 0} />
              <StockItem label="Reserved" value={stock?.reservedStock ?? stock?.reserved_stock ?? 0} />
              <StockItem label="Available" value={stock?.availableStock ?? Math.max(0, (stock?.current_stock ?? 0) - (stock?.reservedStock ?? stock?.reserved_stock ?? 0))} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StockItem = ({ label, value }) => (
  <div className="rounded-lg bg-muted p-3">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
  </div>
);

export default StockModal;
