import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import warehouseApi from "@/apis/warehouseApi";
import { notify } from "@/lib/notify";

const useWarehouse = (page, limit) => {
  const queryClient = useQueryClient();

  // GET - fetch all warehouses
  const { data: warehousesData, isLoading, error } = useQuery({
    queryKey: ["warehouses", page, limit],
    queryFn: () => warehouseApi.getAllWarehouses(page, limit),
    enabled: !!page && !!limit,
  });

  // POST - create warehouse
  const createMutation = useMutation({
    mutationFn: (data) => warehouseApi.createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      notify.success("Warehouse created successfully");
    },
    onError: (error) => notify.apiError(error, "Failed to create warehouse"),
  });

  // PUT - update warehouse
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => warehouseApi.updateWarehouse(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse", id] });
      notify.success("Warehouse updated successfully");
    },
    onError: (error) => notify.apiError(error, "Failed to update warehouse"),
  });

  // DELETE - delete warehouse
  const deleteMutation = useMutation({
    mutationFn: (id) => warehouseApi.deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      notify.success("Warehouse deleted successfully");
    },
    onError: (error) => notify.apiError(error, "Failed to delete warehouse"),
  });

  return {
    warehouses: warehousesData?.data?.warehouses ?? [],
    pagination: warehousesData?.data?.pagination ?? {},
    isLoading,
    error,
    createMutation,
    updateMutation,
    deleteMutation,
  };
};

// GET - fetch a single warehouse by id
export const useWarehouseDetail = (id) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["warehouse", id],
    queryFn: () => warehouseApi.getWarehouseById(id),
    enabled: !!id,
  });

  return { warehouse: data?.data ?? null, isLoading, error };
};

// PATCH - warehouse operational settings (store hours, capacity, auto-assign)
export const useWarehouseSettings = (id) => {
  const queryClient = useQueryClient();

  const updateSettingsMutation = useMutation({
    mutationFn: (data) => warehouseApi.updateWarehouseSettings(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse", id] });
      notify.success("Warehouse settings updated");
    },
    onError: (error) => notify.apiError(error, "Failed to update warehouse settings"),
  });

  return { updateSettingsMutation };
};

// GET/POST/DELETE - staff assigned to a warehouse
export const useWarehouseTeam = (id) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["warehouse-team", id],
    queryFn: () => warehouseApi.getWarehouseTeam(id),
    enabled: !!id,
  });

  const assignMutation = useMutation({
    mutationFn: (userId) => warehouseApi.assignWarehouseStaff(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-team", id] });
      notify.success("Staff assigned to warehouse");
    },
    onError: (error) => notify.apiError(error, "Failed to assign staff"),
  });

  const removeMutation = useMutation({
    mutationFn: (userId) => warehouseApi.removeWarehouseStaff(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-team", id] });
      notify.success("Staff removed from warehouse");
    },
    onError: (error) => notify.apiError(error, "Failed to remove staff"),
  });

  return {
    team: data?.data?.team ?? [],
    isLoading,
    error,
    assignMutation,
    removeMutation,
  };
};

export default useWarehouse;
