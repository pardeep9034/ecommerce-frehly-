import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import deliveryZoneApi from "@/apis/deliveryZoneApi";

// filters: { city?, search? } (the Zones page); the server filters before paging.
const useDeliveryZone = (page, limit, filters = {}) => {
  const queryClient = useQueryClient();
  const {data: deliveryZonesData, isLoading, error} = useQuery({
    queryKey: ["deliveryZones", page, limit, filters],
    queryFn: () => deliveryZoneApi.fetchAllDeliveryZones(page, limit, filters),
    enabled: !!page && !!limit,
    placeholderData: keepPreviousData,
  });
  // Every key starting with "deliveryZones", the city list included.
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["deliveryZones"] });
  //create
  const createMutation = useMutation({
    mutationFn: (data) => deliveryZoneApi.createDeliveryZone(data),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => deliveryZoneApi.updateDeliveryZone(id, data),
    onSuccess: invalidate,
  });
    const deleteMutation = useMutation({
    mutationFn: (id) => deliveryZoneApi.deleteDeliveryZone(id),
    onSuccess: invalidate,
    });

  return { deliveryZonesData, isLoading, error, createMutation, updateMutation, deleteMutation };
}

// Every city that has a zone, for the Zones page city filter.
export const useDeliveryZoneCities = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["deliveryZones", "cities"],
    queryFn: deliveryZoneApi.fetchCities,
  });
  return { cities: data ?? [], isLoading };
};

export default useDeliveryZone;
