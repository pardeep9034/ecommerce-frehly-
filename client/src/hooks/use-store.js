import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import StoreApi from "../apis/storeApi";
import { getProfile } from "../apis/authApi";
import OrderApi from "../apis/orderApi";
import { useWarehouseDetail } from "./use-warehouse";

// Own profile + own warehouse, from the existing /auth/profile and /warehouses/:id.
// Fetched once per session: staleTime Infinity reuses the cached response on every page
// and window focus; a warehouse edit still refetches via invalidateQueries(["warehouse", id]).
export const useStoreMe = () => {
  const { data: profile, isLoading } = useQuery({ queryKey: ["auth-profile"], queryFn: getProfile, staleTime: Infinity });
  const { warehouse } = useWarehouseDetail(profile?.warehouse_id, { staleTime: Infinity });
  const staff = profile && {
    name: [profile.first_name, profile.last_name].filter(Boolean).join(" "),
    phone: profile.phone,
    warehouse_id: profile.warehouse_id,
    warehouse_name: warehouse?.name,
  };
  return { staff, isLoading };
};

// The statuses the board's columns show (see lib/orderStage.js).
const BOARD_STATUSES = [
  "PLACED", "CONFIRMED", "AWAITING_CUSTOMER_CONFIRMATION", "READY_FOR_ASSIGNMENT",
  "ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "HANDOVER_IN_PROGRESS", "CANCELLED", "DELIVERY_FAILED",
].join(",");

// The existing GET /orders/admin/all, filtered to the staff member's own warehouse.
// ponytail: newest 100 only and no date filter, so old cancelled orders pile into that
// column; add a from-date filter to the API when a store has more than 100 open orders.
export const useStoreQueue = (warehouseId) => {
  const { data, isLoading } = useQuery({
    queryKey: ["store-queue", warehouseId],
    queryFn: () => OrderApi.fetchAllOrders(1, 100, BOARD_STATUSES, undefined, warehouseId),
    enabled: !!warehouseId,
    refetchInterval: 30000,
  });
  return { orders: data?.data?.orders || [], isLoading: isLoading || !warehouseId };
};

export const useStoreOrder = (orderId) => {
  const { data, isLoading } = useQuery({
    queryKey: ["store-order", orderId],
    queryFn: () => StoreApi.getOrder(orderId),
    enabled: !!orderId,
  });
  return { order: data?.data, isLoading };
};

const invalidateOrder = (queryClient, orderId) => {
  queryClient.invalidateQueries({ queryKey: ["store-queue"] });
  queryClient.invalidateQueries({ queryKey: ["store-order", orderId] });
};

export const useUpdateItemStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, itemId, status, admin_remarks }) =>
      StoreApi.updateItemStatus(orderId, itemId, { status, admin_remarks }),
    onSuccess: (_data, { orderId }) => invalidateOrder(queryClient, orderId),
  });
};

export const useFinalizeItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId) => StoreApi.finalizeItems(orderId),
    onSuccess: (_data, orderId) => invalidateOrder(queryClient, orderId),
  });
};

export const usePackOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, bagCount, rackLabel }) =>
      StoreApi.packOrder(orderId, { bag_count: bagCount, rack_label: rackLabel }),
    onSuccess: (_data, { orderId }) => invalidateOrder(queryClient, orderId),
  });
};

export const useAvailableRiders = (orderId) => {
  const { data, isLoading } = useQuery({
    queryKey: ["store-riders", orderId],
    queryFn: () => StoreApi.getAvailableRiders(orderId),
    enabled: !!orderId,
  });
  return { riders: data?.data || [], isLoading };
};

export const useAssignRider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, deliveryPartnerId }) => StoreApi.assignRider(orderId, deliveryPartnerId),
    onSuccess: (_data, { orderId }) => invalidateOrder(queryClient, orderId),
  });
};

export const useStoreHandovers = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["store-handovers"],
    queryFn: StoreApi.getHandovers,
    refetchInterval: 15000,
  });
  return { handovers: data?.data || [], isLoading };
};

export const useConfirmHandover = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, pickupCode }) => StoreApi.confirmHandover(orderId, pickupCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-handovers"] });
      queryClient.invalidateQueries({ queryKey: ["store-queue"] });
    },
  });
};
