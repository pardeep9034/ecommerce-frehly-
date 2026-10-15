import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import StoreApi from "../apis/storeApi";

export const useStoreMe = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["store-me"],
    queryFn: StoreApi.getMe,
  });
  return { staff: data?.data, isLoading };
};

export const useStoreQueue = (params = {}) => {
  const { data, isLoading } = useQuery({
    queryKey: ["store-queue", params],
    queryFn: () => StoreApi.getQueue(params),
  });
  return { orders: data?.data?.items || [], isLoading };
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
