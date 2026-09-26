import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DeliveryApi from "../apis/deliveryApi";

export const useAvailablePartners = (enabled) => {
  const { data, isLoading } = useQuery({
    queryKey: ["available-delivery-partners"],
    queryFn: () => DeliveryApi.fetchAvailablePartners(),
    enabled,
  });

  return { partners: data?.data || [], isLoading };
};

export const useDeliverySlots = (enabled) => {
  const { data, isLoading } = useQuery({
    queryKey: ["delivery-slots"],
    queryFn: () => DeliveryApi.fetchDeliverySlots(),
    enabled,
  });

  return { slots: data?.data || [], isLoading };
};

export const useAssignDelivery = (orderId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => DeliveryApi.assignOrder(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] }),
  });
};
