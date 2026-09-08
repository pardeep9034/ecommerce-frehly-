import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import WarehouseApi from "@/apis/warehouseApi";
import InventoryApi from "@/apis/inventoryApi";
import SearchableSelector from "../common/searchableSelect";

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
  });

  const warehouses = useMemo(() => getWarehouses(warehousesQuery.data), [warehousesQuery.data]);
  const stock = getStock(stockQuery.data);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2937]/35 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-md rounded-xl border border-[#e5e7eb] bg-white shadow-card" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-5 sm:px-7">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#1f2937]">Variant Stock</h2>
            <p className="mt-0.5 text-sm text-[#6b7280]">Variant ID: {variantId}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close stock modal" className="rounded-lg p-1 text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="text-sm font-medium text-[#1f2937]">Warehouse</label>
            <SearchableSelector
              data={warehouses}
              labelKey="name"
              valueKey="id"
              onSelect={(id) => setWarehouseId(id)}
              placeholder={warehousesQuery.isLoading ? "Loading warehouses..." : "Search and select a warehouse"}
              disabled={warehousesQuery.isLoading}
              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132] disabled:bg-gray-50 disabled:text-gray-500"
            />
            {warehousesQuery.isError && <p className="mt-1 text-xs text-red-600">Unable to load warehouses.</p>}
          </div>

          {!warehouseId && <p className="rounded-lg bg-[#f8faf8] px-4 py-3 text-sm text-[#6b7280]">Select a warehouse to view this variant’s stock.</p>}
          {stockQuery.isLoading && <p className="rounded-lg bg-[#f8faf8] px-4 py-3 text-sm text-[#6b7280]">Loading stock…</p>}
          {stockQuery.isError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">Unable to load stock for this warehouse.</p>}
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
  <div className="rounded-lg bg-[#f8faf8] p-3">
    <p className="text-xs font-medium text-[#6b7280]">{label}</p>
    <p className="mt-1 text-lg font-semibold text-[#1f2937]">{value}</p>
  </div>
);

export default StockModal;
