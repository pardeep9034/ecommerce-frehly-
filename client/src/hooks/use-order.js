import { useMutation, useQuery } from "@tanstack/react-query";
import OrderApi from "../apis/orderApi";

const useOrder = () => {
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
