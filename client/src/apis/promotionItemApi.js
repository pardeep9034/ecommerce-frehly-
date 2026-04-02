import axios from "axios";

const API_URL = "http://localhost:4000/products";

export const fetchPromotionItems = async (promotionId) => {
    try {
        const response = await axios.get(`${API_URL}/promotion-items/${promotionId}/items`);
        return response.data.data; // array of items
    } catch (error) {
        throw new Error(error.response?.data?.message || "Error fetching promotion items");
    }
};

export const fetchAllPromotionItems = async () => {
    try {
        const response = await axios.get(`${API_URL}/promotion-items/all`);
        return response.data.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Error fetching all promotion items");
    }
};

export const addPromotionItem = async (promotionId, itemData) => {
    try {
        const response = await axios.post(`${API_URL}/promotion-items/${promotionId}/items`, itemData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Error adding promotion item");
    }
};

export const removePromotionItem = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/promotion-items/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Error removing promotion item");
    }
};
