import { useMutation } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { addToCartApi } from "@/apis/cartApi";
import api from "@/apis/axiosInstance"
import { notify } from "@/lib/notify";
import { openLocationPicker } from "@/redux/locationSlice";

const useAddToCartMutation = () => {
    const dispatch = useDispatch();
    const location = useSelector((state) => state.location.current);

    return useMutation({

        mutationFn: async (cartItem) => {
            // The cart belongs to one store, so it needs a location that a store serves.
            if (!location?.serviceable) {
                dispatch(openLocationPicker());
                throw Object.assign(new Error("Choose a delivery location first"), { needsLocation: true });
            }

            const response =
                await addToCartApi(cartItem);
                return response;


            },

        onSuccess: () => {
            notify.success("Added to cart");
        },
        onError: (error) => {
            if (error.needsLocation) {
                notify.info(location ? "We don't deliver to this location yet" : "Choose a delivery location first");
                return;
            }
            notify.apiError(error, "Could not add item to cart");
        },

    });

};
const increaseQuantityMutation = () => {
  return useMutation({
    mutationFn: async ({ cartItemId }) => {
      const response = await api.patch(
        `/cart/item/${cartItemId}/increase-quantity`
      );

      return response.data;
    },
  });
};
const decreaseQuantityMutation = () => {
  return useMutation({
    mutationFn: async ({ cartItemId }) => {
      const response = await api.patch(
        `/cart/item/${cartItemId}/decrease-quantity`
      );

      return response.data;
    },
  });
};


export { useAddToCartMutation, increaseQuantityMutation, decreaseQuantityMutation };