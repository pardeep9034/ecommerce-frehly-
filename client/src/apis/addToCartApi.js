import api from "./axiosInstance";

export const addToCartApi = async (cartItem) => {
    try{
        const response = await api.post("/cart/add",cartItem);
        return response.data;
    }
    catch(error){
        console.error("Add to cart error:", error);
        throw error;
    }
}