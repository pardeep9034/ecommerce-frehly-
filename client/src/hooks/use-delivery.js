import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DeliveryApi from "../apis/deliveryApi";

export const useAvailablePartners = (enabled) => {
  const { data, isLoading } = useQuery({
    queryKey: ["available-delivery-partners"],
    queryFn: () => DeliveryApi.fetchAvailablePartners(),
    enabled,
  });

  return { partners: data?.data || [], isLoading };
};

export const usePartners = (params) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["delivery-partners", params],
    queryFn: () => DeliveryApi.fetchPartners(params),
    placeholderData: keepPreviousData,
  });

  return { partners: data?.data?.partners ?? [], pagination: data?.data?.pagination, isLoading, isError };
};

// The record of how one partner came on (staff only). `application` is null for a partner an admin created directly.
export const usePartnerOnboarding = (partnerId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["partner-onboarding", partnerId],
    queryFn: () => DeliveryApi.fetchOnboarding(partnerId),
    enabled: !!partnerId,
    retry: false,
  });

  return { onboarding: data, isLoading, error };
};

export const usePartnerWork = (partnerId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["partner-work", partnerId],
    queryFn: () => DeliveryApi.fetchPartnerWork(partnerId),
    enabled: !!partnerId,
  });

  return { work: data, isLoading, error };
};

export const useOrderAssignment = (orderId, enabled) => {
  const { data, isLoading } = useQuery({
    queryKey: ["order-assignment", orderId],
    queryFn: () => DeliveryApi.fetchOrderAssignment(orderId),
    enabled,
  });

  return { assignment: data ?? null, isLoading };
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });
      queryClient.invalidateQueries({ queryKey: ["order-assignment", orderId] });
    },
  });
};
