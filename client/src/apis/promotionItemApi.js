import api from "./axiosInstance";

export const fetchPromotionItems = async (promotionId) => {
    try {
        const response = await api.get(`/promotion-items/${promotionId}/items`);
        return response.data.data; // array of items
    } catch (error) {
        throw new Error(error.response?.data?.message || "Error fetching promotion items");
    }
};

export const fetchAllPromotionItems = async () => {
    try {
        const response = await api.get(`/promotion-items/all`);
        return response.data.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Error fetching all promotion items");
    }
};

export const addPromotionItem = async (promotionId, itemData) => {
    try {
        const response = await api.post(`/promotion-items/${promotionId}/items`, itemData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Error adding promotion item");
    }
};

export const removePromotionItem = async (id) => {
    try {
        const response = await api.delete(`/promotion-items/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Error removing promotion item");
    }
};
