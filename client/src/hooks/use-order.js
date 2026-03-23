import { useQuery } from "@tanstack/react-query";
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

  return {
    orders: orders?.data || [],
    isLoading,
    isError,
    error,
    refetch,
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
