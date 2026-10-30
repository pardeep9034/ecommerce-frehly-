import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import warehouseApi from "@/apis/warehouseApi";
import staffApi from "@/apis/staffApi";
import { notify } from "@/lib/notify";

// filters: { city? } (the Warehouses page); the server filters before paging.
const useWarehouse = (page, limit, filters = {}) => {
  const queryClient = useQueryClient();

  // GET - fetch all warehouses
  const { data: warehousesData, isLoading, error } = useQuery({
    queryKey: ["warehouses", page, limit, filters],
    queryFn: () => warehouseApi.getAllWarehouses(page, limit, filters),
    enabled: !!page && !!limit,
    placeholderData: keepPreviousData,
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

// GET - every city that has a warehouse (Warehouses page city filter). Under "warehouses", so the mutations above
// refresh it.
export const useWarehouseCities = () => {
  const { data } = useQuery({
    queryKey: ["warehouses", "cities"],
    queryFn: warehouseApi.getCities,
  });
  return { cities: data ?? [] };
};

// GET - fetch a single warehouse by id
export const useWarehouseDetail = (id, options = {}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["warehouse", id],
    queryFn: () => warehouseApi.getWarehouseById(id),
    enabled: !!id,
    ...options,
  });

  return { warehouse: data?.data ?? null, isLoading, error };
};

// PUT - the Settings tab (status, pause / maintenance message, store hours, pack-by): the same update route,
// with its own messages.
export const useWarehouseSettings = (id) => {
  const queryClient = useQueryClient();

  const updateSettingsMutation = useMutation({
    mutationFn: (data) => warehouseApi.updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse", id] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      notify.success("Warehouse settings saved");
    },
    onError: (error) => notify.apiError(error, "Failed to save warehouse settings"),
  });

  return { updateSettingsMutation };
};

// Who works at a warehouse is each staff account's own warehouse_id (auth-service), so assigning or removing
// someone edits their account; there is no separate team table. Read the team from useStaff, filtered by warehouse.
export const useWarehouseTeam = (id) => {
  const queryClient = useQueryClient();
  const moveTo = (warehouseId) => (userId) => staffApi.updateStaff(userId, { warehouse_id: warehouseId });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["staff"] });
    queryClient.invalidateQueries({ queryKey: ["staff-detail"] });
  };

  // Moves people here (anyone at another warehouse leaves it). `replacing`: the manager being changed, unassigned
  // afterwards so the warehouse keeps one manager.
  const assignMutation = useMutation({
    mutationFn: async ({ userIds, replacing }) => {
      await Promise.all(userIds.map(moveTo(Number(id))));
      if (replacing) await moveTo(null)(replacing);
    },
    onSuccess: (_, { userIds, replacing }) => {
      invalidate();
      notify.success(replacing ? "Manager changed" : userIds.length === 1 ? "1 person assigned" : `${userIds.length} people assigned`);
    },
    onError: (error) => notify.apiError(error, "Failed to assign staff"),
  });

  const removeMutation = useMutation({
    mutationFn: moveTo(null),
    onSuccess: () => {
      invalidate();
      notify.success("Removed from this warehouse");
    },
    onError: (error) => notify.apiError(error, "Failed to remove staff"),
  });

  return { assignMutation, removeMutation };
};

export default useWarehouse;
