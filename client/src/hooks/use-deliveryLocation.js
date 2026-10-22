import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import deliveryZoneApi from "@/apis/deliveryZoneApi";
import { setLocation } from "@/redux/locationSlice";
import { notify } from "@/lib/notify";

// What serviceability needs from a saved address: its pincode (when it is 6 digits) and its pin (when it has one).
export const addressPoint = (address) => {
  const pincode = String(address.postal_code ?? "").trim();
  return {
    pincode: /^\d{6}$/.test(pincode) ? pincode : undefined,
    lat: address.latitude ?? undefined,
    lng: address.longitude ?? undefined,
  };
};

// "HOME · 12 Sector 70" for a saved address, else "Mohali, 160062".
export const locationLabel = (location) =>
  location.label
  || [location.serviceable ? location.city || location.area : null, location.pincode].filter(Boolean).join(", ")
  || "Current location";

const useDeliveryLocation = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const location = useSelector((state) => state.location.current);

  // choose.mutate({ pincode } | { lat, lng } | { address }) checks serviceability and saves the result.
  const choose = useMutation({
    mutationFn: async ({ address, ...point }) => {
      const query = address ? addressPoint(address) : point;
      const result = await deliveryZoneApi.checkServiceability(query);
      return {
        ...result,
        lat: query.lat ?? null,
        lng: query.lng ?? null,
        address_id: address?.id ?? null,
        label: address ? `${address.address_type} · ${address.address_line_1}` : null,
      };
    },
    onSuccess: (next) => {
      const storeChanged = next.warehouse_id !== location?.warehouse_id;
      dispatch(setLocation(next));
      // Stock and the cart were fetched for the old store.
      if (storeChanged) queryClient.invalidateQueries();
    },
    onError: (error) => notify.apiError(error, "Couldn't check delivery for this location"),
  });

  return { location, choose };
};

export default useDeliveryLocation;
