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
export const getUserCart = async () => {
    try{
        const response = await api.get("/cart");
        return response.data;
    }
    catch(error){
        console.error("get user cart error:", error);
        throw error;
    }
}