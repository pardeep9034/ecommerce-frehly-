import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import InventoryApi from "@/apis/inventoryApi";
import { notify } from "@/lib/notify";

const useInventory = (page = 1, limit = 10, warehouseId, variantIds = []) => {
  const queryClient = useQueryClient();

  // GET - fetch inventory with pagination
  const {
    data: inventory,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["inventory", "warehouse", warehouseId, page, limit],
    queryFn: () => InventoryApi.fetchInventoryByWarehouse(warehouseId, page, limit),
    enabled: Boolean(warehouseId),
  });

  // GET - stat-card counts for the whole warehouse (not just this page), counted by the server.
  const { data: stockSummary } = useQuery({
    queryKey: ["inventory", "summary", warehouseId],
    queryFn: () => InventoryApi.fetchStockSummary(warehouseId),
    enabled: Boolean(warehouseId),
  });

  // GET - which of the given variant ids are currently in stock
  const {
    data: inStockData,
    isLoading: inStockLoading,
  } = useQuery({
    queryKey: ["inStockVariantIds", variantIds],
    queryFn: () => InventoryApi.getInStockVariantIds(variantIds),
    enabled: variantIds.length > 0,
  });

  // POST - create inventory
  const createMutation = useMutation({
    mutationFn: (data) => InventoryApi.createInventory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  // PUT - update inventory
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => InventoryApi.updateInventory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  // DELETE - delete inventory
  const deleteMutation = useMutation({
    mutationFn: (id) => InventoryApi.deleteInventory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      notify.success("Inventory record deleted successfully");
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete inventory record");
    },
  });

  return {
    inventory,
    stockSummary,
    isLoading,
    error,
    inStockVariantIds: inStockData?.data,
    inStockLoading,
    createInventory: createMutation,
    updateInventory: updateMutation,
    deleteInventory: deleteMutation,
  };
};

// Storefront stock at the customer's store: Map(variantId -> available) holding only the variants that store
// carries. stock is null when no store is chosen yet (show every variant, no stock state) or while loading.
export const useStoreStock = (variantIds = []) => {
  const warehouseId = useSelector((state) => state.location.current?.warehouse_id);
  const enabled = Boolean(warehouseId) && variantIds.length > 0;
  const { data, isLoading } = useQuery({
    // axiosInstance sends this warehouse as x-warehouse-id.
    queryKey: ["storeStock", warehouseId, variantIds],
    queryFn: () => InventoryApi.fetchStoreStock(variantIds),
    enabled,
  });
  const stock = useMemo(
    () => (data ? new Map(data.map((row) => [Number(row.variant_id), Number(row.available)])) : null),
    [data]
  );
  return { hasStore: Boolean(warehouseId), stock, isLoading: enabled && isLoading };
};

// Every variant gets in_stock: available > 0 at the customer's store, and a variant the store doesn't carry counts as
// out of stock (shown, not hidden; changed 2026-10-29, Task 204). Without stock (no store chosen) all are in stock.
export const applyStoreStock = (variants, stock) =>
  variants.map((v) => ({ ...v, in_stock: stock ? (stock.get(Number(v.id)) ?? 0) > 0 : true }));

export default useInventory;
