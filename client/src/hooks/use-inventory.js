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
    queryKey: ["inventory", "warehouse", warehouseId],
    queryFn: () => InventoryApi.fetchInventoryByWarehouse(warehouseId),
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
    isLoading,
    error,
    inStockVariantIds: inStockData?.data,
    inStockLoading,
    createInventory: createMutation,
    updateInventory: updateMutation,
    deleteInventory: deleteMutation,
  };
};

export default useInventory;
