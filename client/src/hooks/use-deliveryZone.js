import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import deliveryZoneApi from "@/apis/deliveryZoneApi";


const useDeliveryZone = (page, limit, deliveryZoneId) => {
  const queryClient = useQueryClient();
  const {data: deliveryZonesData, isLoading, error} = useQuery({
    queryKey: ["deliveryZones", page, limit],
    queryFn: () => deliveryZoneApi.fetchAllDeliveryZones(page, limit),
    enabled: !!page && !!limit,
  });
  //create 
  const createMutation = useMutation({
    mutationFn: (data) => deliveryZoneApi.createDeliveryZone(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["deliveryZones"]);
    }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => deliveryZoneApi.updateDeliveryZone(id, data),
    onSuccess: () => {  
        queryClient.invalidateQueries(["deliveryZones"]);
    }
  });
    const deleteMutation = useMutation({
    mutationFn: (id) => deliveryZoneApi.deleteDeliveryZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["deliveryZones"]);
    }
    });

  return { deliveryZonesData, isLoading, error, createMutation, updateMutation, deleteMutation };
}

export default useDeliveryZone;