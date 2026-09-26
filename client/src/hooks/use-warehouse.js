import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import warehouseApi from "@/apis/warehouseApi";
import { notify } from "@/lib/notify";
import { DEMO_NOTICE, isApiMissing, retryUnlessMissing } from "@/lib/demoData";

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

// A missing endpoint (PATCH /settings, /team) is expected until the backend ships it:
// say so plainly instead of a generic "failed" error.
const notifyMutationError = (error, fallback) =>
  isApiMissing(error) ? notify.warning(DEMO_NOTICE) : notify.apiError(error, fallback);

// PATCH - warehouse operational settings (status, store hours, pack-by, capacity, racks, auto-assign)
export const useWarehouseSettings = (id) => {
  const queryClient = useQueryClient();

  const updateSettingsMutation = useMutation({
    mutationFn: (data) => warehouseApi.updateWarehouseSettings(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse", id] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      notify.success("Warehouse settings saved");
    },
    onError: (error) => notifyMutationError(error, "Failed to save warehouse settings"),
  });

  return { updateSettingsMutation };
};

// GET/POST/DELETE - staff assigned to a warehouse. `isDemo` means GET /team doesn't
// exist yet; the page then derives the team from the (demo) staff list instead.
export const useWarehouseTeam = (id) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["warehouse-team", id],
    queryFn: () => warehouseApi.getWarehouseTeam(id),
    enabled: !!id,
    retry: retryUnlessMissing,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["warehouse-team", id] });
    queryClient.invalidateQueries({ queryKey: ["staff"] });
  };

  // Assigns several people at once; each person works at one warehouse, so the
  // backend moves anyone already assigned elsewhere.
  const assignMutation = useMutation({
    mutationFn: (userIds) => Promise.all(userIds.map((userId) => warehouseApi.assignWarehouseStaff(id, userId))),
    onSuccess: (_, userIds) => {
      invalidate();
      notify.success(userIds.length === 1 ? "1 person assigned" : `${userIds.length} people assigned`);
    },
    onError: (error) => notifyMutationError(error, "Failed to assign staff"),
  });

  const removeMutation = useMutation({
    mutationFn: (userId) => warehouseApi.removeWarehouseStaff(id, userId),
    onSuccess: () => {
      invalidate();
      notify.success("Removed from this warehouse");
    },
    onError: (error) => notifyMutationError(error, "Failed to remove staff"),
  });

  return {
    team: data?.data?.team ?? [],
    isDemo: isApiMissing(error),
    isLoading,
    error,
    assignMutation,
    removeMutation,
  };
};

export default useWarehouse;
