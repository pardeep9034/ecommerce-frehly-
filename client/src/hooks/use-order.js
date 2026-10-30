import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import OrderApi from "../apis/orderApi";
import { clearCart } from "@/redux/cartSlice";

const useOrder = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const {
    data: orders,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => OrderApi.fetchMyOrders(),
    // signed out (cart page) the call can only 401, and each 401 starts a token refresh
    enabled: !!localStorage.getItem("token"),
  });
   const placeOrderMutation = useMutation({
    mutationFn: (data) => OrderApi.placeOrder(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["my-orders"],
      });

      queryClient.invalidateQueries({
        queryKey: ["cart"],
      });

      dispatch(clearCart());
    },
  });

  return {
    orders: orders?.data || [],
    isLoading,
    isError,
    error,
    refetch,
    placeOrder:placeOrderMutation
  };
};

export const ORDER_STATUS_GROUPS = [
  { key: "all", label: "All", statuses: null },
  { key: "payment", label: "Payment", statuses: ["PENDING_PAYMENT", "PAYMENT_FAILED", "PAYMENT_EXPIRED"] },
  { key: "new", label: "New", statuses: ["PLACED"] },
  { key: "store", label: "In store", statuses: ["CONFIRMED", "AWAITING_CUSTOMER_CONFIRMATION", "READY_FOR_ASSIGNMENT"] },
  { key: "delivery", label: "With rider", statuses: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "HANDOVER_IN_PROGRESS"] },
  { key: "done", label: "Completed / cancelled", statuses: ["DELIVERED", "CANCELLED", "DELIVERY_FAILED", "RETURNED_TO_STORE"] },
];

// GET /orders/admin/stats: today's orders/revenue, per-day series, counts by status, cancel rate, avg delivery.
// One aggregate request (cached 30 s on the server); `warehouseId` empty = all warehouses.
export const useOrderStats = (warehouseId, days = 7) => {
  const query = useQuery({
    queryKey: ["admin-order-stats", warehouseId || null, days],
    queryFn: () => OrderApi.fetchOrderStats(warehouseId || undefined, days),
    staleTime: 30000,
  });
  return { stats: query.data?.data ?? null, isLoading: query.isLoading };
};

// Counts per real status, aggregated client-side into the design's 6 tab groups.
export const useOrderStatusCounts = (warehouseId) => {
  const { stats, isLoading } = useOrderStats(warehouseId);
  const counts = stats?.byStatus ?? {};

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const byGroup = Object.fromEntries(
    ORDER_STATUS_GROUPS.map((group) => [
      group.key,
      group.statuses ? group.statuses.reduce((sum, status) => sum + (counts[status] ?? 0), 0) : total,
    ])
  );

  return { counts, byGroup, isLoading };
};

// GET /orders/admin/all accepts one status or a list (status[]=A&status[]=B → IN), so grouped tabs
// paginate server-side like any other. `statuses` null/empty means no status filter.
export const useAdminOrders = ({ statuses, page, limit, search, warehouseId, userId }) => {
  const query = useQuery({
    queryKey: ["admin-orders", statuses, page, limit, search, warehouseId, userId],
    queryFn: () =>
      OrderApi.fetchAllOrders(page, limit, statuses?.length ? statuses : undefined, search || undefined, warehouseId, userId),
    enabled: Boolean(warehouseId || userId), // the API refuses "all warehouses" unless it is one customer
    placeholderData: keepPreviousData,
  });

  return {
    orders: query.data?.data?.orders || [],
    isLoading: query.isLoading,
    pagination: query.data?.data?.pagination || { totalItems: 0, currentPage: page, totalPages: 1 },
  };
};

export const useOrderStatusBoard = (statuses = [], previewLimit = 5, search = "") => {
  const results = useQueries({
    queries: statuses.map((status) => ({
      queryKey: ["admin-orders", 1, previewLimit, status, search],
      queryFn: () => OrderApi.fetchAllOrders(1, previewLimit, status, search || undefined),
    })),
  });

  const columns = statuses.map((status, index) => {
    const result = results[index];
    return {
      status,
      orders: result.data?.data?.orders || [],
      total: result.data?.data?.pagination?.totalItems ?? 0,
      isLoading: result.isLoading,
    };
  });

  return { columns };
};

export const useOrderFulfillment = (orderId) => {
  const queryClient = useQueryClient();

  const invalidateOrder = () => queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });

  const updateItemStatus = useMutation({
    mutationFn: ({ itemId, status, remarks }) => OrderApi.updateOrderItemStatus(orderId, itemId, { status, remarks }),
    onSuccess: invalidateOrder,
  });

  const finalizeItems = useMutation({
    mutationFn: () => OrderApi.finalizeOrderItems(orderId),
    onSuccess: invalidateOrder,
  });

  return { updateItemStatus, finalizeItems };
};

export const useConfirmPartialOrder = (orderId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (decision) => OrderApi.confirmPartialOrder(orderId, decision),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] }),
  });
};

export const useRetryPayment = (orderId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => OrderApi.retryPayment(orderId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] }),
  });
};

export const useRequestReturn = (orderId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) => OrderApi.requestReturn(orderId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] }),
  });
};

const LIVE_ORDER_STATUSES =new Set(["DELIVERED", "CANCELLED", "PAYMENT_FAILED", "PAYMENT_EXPIRED"]);

export const useOrderDetail = (orderId) => {
  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: () => OrderApi.fetchOrderById(orderId),
    enabled: !!orderId,
    // The delivery timeline progresses on the server with no user action —
    // poll while the order is still moving so the page reflects that
    // without a manual refresh.
    refetchInterval: (query) => (LIVE_ORDER_STATUSES.has(query.state.data?.data?.status) ? false : 15000),
  });

  return {
    order: order?.data,
    isLoading,
    isError,
    error,
  };
};


export default useOrder;
