import { useMutation } from "@tanstack/react-query";
import { addToCartApi } from "@/apis/cartApi";
import api from "@/apis/axiosInstance"

const useAddToCartMutation = () => {

    return useMutation({

        mutationFn: async (cartItem) => {

            const response =
                await addToCartApi(cartItem);
                return response;

           
            }

          

        

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