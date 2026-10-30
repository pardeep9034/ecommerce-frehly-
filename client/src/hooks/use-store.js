import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
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
  "ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "HANDOVER_IN_PROGRESS", "CANCELLED", "DELIVERY_FAILED", "RETURNED_TO_STORE",
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
      StoreApi.updateItemStatus(orderId, itemId, { status, remarks: admin_remarks }), // the API saves `remarks` as admin_remarks
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

const riderMeta = (rider) =>
  [Number.isFinite(rider.distance) && `${rider.distance.toFixed(1)} km away`, `${rider.current_active_orders} of ${rider.max_active_orders} orders`]
    .filter(Boolean)
    .join(" · ");

export const useAvailableRiders = (warehouseId) => {
  const { data, isLoading } = useQuery({
    queryKey: ["store-riders", warehouseId],
    queryFn: () => StoreApi.getAvailableRiders(warehouseId),
    enabled: !!warehouseId,
    select: (response) =>
      (response?.data || []).map((rider) => ({ id: rider.id, name: rider.name || rider.vehicle_number || "Rider", meta: riderMeta(rider) })),
  });
  return { riders: data || [], isLoading };
};

export const useAssignRider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, deliveryPartnerId }) => StoreApi.assignRider(orderId, deliveryPartnerId),
    onSuccess: (_data, { orderId }) => {
      invalidateOrder(queryClient, orderId);
      queryClient.invalidateQueries({ queryKey: ["store-riders"] });
    },
  });
};

// Riders coming to collect: the store's ASSIGNED orders (from the board's query), each with who holds it.
// ponytail: one assignment lookup per waiting order; add a by-store list to delivery-service if a store has dozens waiting.
export const useStoreHandovers = (warehouseId) => {
  const { orders, isLoading } = useStoreQueue(warehouseId);
  const waiting = orders.filter((order) => order.status === "ASSIGNED");
  const assignments = useQueries({
    queries: waiting.map((order) => ({
      queryKey: ["store-assignment", order.id],
      queryFn: () => StoreApi.getAssignment(order.id),
    })),
  });
  const handovers = waiting.map((order, index) => {
    const assignment = assignments[index]?.data?.data;
    return { ...order, assignment_id: assignment?.assignment_id, rider_name: assignment?.partner?.name };
  });
  return { handovers, isLoading };
};

export const useConfirmHandover = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, pickupCode }) => StoreApi.confirmHandover(assignmentId, pickupCode),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["store-queue"] }),
  });
};

// Who holds an order now, with what a failed drop needs: attempts, last_failure, can_retry, return_due.
export const useStoreAssignment = (orderId, enabled = true) => {
  const { data, isLoading } = useQuery({
    queryKey: ["store-assignment", orderId],
    queryFn: () => StoreApi.getAssignment(orderId),
    enabled: !!orderId && enabled,
  });
  return { assignment: data?.data || null, isLoading };
};

// The Returns page: goods still with riders, turned-away lines waiting to be checked, and failed orders back in the
// store. Polled like the board.
export const useStoreReturns = (warehouseId) => {
  const due = useQuery({ queryKey: ["store-returns-due"], queryFn: () => StoreApi.getReturnsDue(), enabled: !!warehouseId, refetchInterval: 30000 });
  const received = useQuery({
    queryKey: ["store-returns", "RECEIVED"],
    queryFn: () => StoreApi.getReturns("RECEIVED"),
    enabled: !!warehouseId,
    refetchInterval: 30000,
  });
  // Customer returns waiting for a decision, or approved and waiting for a rider.
  const customer = useQuery({
    queryKey: ["store-returns", "REQUESTED,APPROVED"],
    queryFn: () => StoreApi.getReturns("REQUESTED,APPROVED"),
    enabled: !!warehouseId,
    refetchInterval: 30000,
  });
  const { orders } = useStoreQueue(warehouseId);
  const customerRows = customer.data?.data || [];
  return {
    due: due.data?.data || [],
    received: received.data?.data || [],
    toReview: customerRows.filter((row) => row.status === "REQUESTED"),
    toPickUp: customerRows.filter((row) => row.status === "APPROVED"),
    backInStore: orders.filter((order) => order.status === "RETURNED_TO_STORE"),
    isLoading: due.isLoading || received.isLoading || customer.isLoading,
  };
};

const refreshReturns = (queryClient, orderId) => {
  ["store-returns-due", "store-returns", "store-assignment"].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  invalidateOrder(queryClient, orderId);
};

export const useReceiveReturn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, returnCode }) => StoreApi.receiveReturn(assignmentId, returnCode),
    onSuccess: (_data, { orderId }) => refreshReturns(queryClient, orderId),
  });
};

export const useInspectReturns = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, items }) => StoreApi.inspectReturns(orderId, items),
    onSuccess: (_data, { orderId }) => refreshReturns(queryClient, orderId),
  });
};

export const useReviewReturn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, returnId, body }) => StoreApi.reviewReturn(orderId, returnId, body),
    onSuccess: (_data, { orderId }) => refreshReturns(queryClient, orderId),
  });
};

export const useAssignPickup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, deliveryPartnerId }) => StoreApi.assignPickup(orderId, deliveryPartnerId),
    onSuccess: (_data, { orderId }) => {
      refreshReturns(queryClient, orderId);
      queryClient.invalidateQueries({ queryKey: ["store-riders"] });
    },
  });
};

export const useCancelReturned = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, items, reason }) => StoreApi.cancelReturned(orderId, items, reason),
    onSuccess: (_data, { orderId }) => refreshReturns(queryClient, orderId),
  });
};

// The admin's Returns page: every store's goods still with riders, and turned-away lines not yet checked.
export const useReturnsOverview = () => {
  const due = useQuery({ queryKey: ["store-returns-due"], queryFn: () => StoreApi.getReturnsDue(), refetchInterval: 60000 });
  const open = useQuery({ queryKey: ["store-returns", "IN_TRANSIT,RECEIVED"], queryFn: () => StoreApi.getReturns("IN_TRANSIT,RECEIVED"), refetchInterval: 60000 });
  const toReview = useQuery({ queryKey: ["store-returns", "REQUESTED"], queryFn: () => StoreApi.getReturns("REQUESTED"), refetchInterval: 60000 });
  return {
    due: due.data?.data || [],
    open: open.data?.data || [],
    toReview: toReview.data?.data || [],
    isLoading: due.isLoading || open.isLoading || toReview.isLoading,
    error: due.error || open.error || toReview.error,
  };
};
