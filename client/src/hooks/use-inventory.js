import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import InventoryApi from "@/apis/inventoryApi";

const useInventory = (page = 1, limit = 10, warehouseId) => {
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
    },
  });

  return {
    inventory,
    isLoading,
    error,
    createInventory: createMutation,
    updateInventory: updateMutation,
    deleteInventory: deleteMutation,
  };
};

export default useInventory;
