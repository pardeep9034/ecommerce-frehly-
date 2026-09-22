import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
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
  });

  return {
    order: order?.data,
    isLoading,
    isError,
    error,
  };
};


export default useOrder;
