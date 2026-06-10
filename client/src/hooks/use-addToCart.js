import { useMutation } from "@tanstack/react-query";
import { addToCartApi } from "@/apis/addToCartApi";

const useAddToCartMutation = () => {

    return useMutation({

        mutationFn: async (cartItem) => {

            const response =
                await addToCartApi(cartItem);

            if (!response.ok) {

                throw new Error(
                    "Failed to add to cart"
                );

            }

            return await response.json();

        }

    });

};

export { useAddToCartMutation };