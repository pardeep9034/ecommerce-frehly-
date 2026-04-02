import api from "./axiosInstance";

export const fetchPromotions = async (page = 1, limit = 10, type = null) => {
  try {
    const params = new URLSearchParams({ page, limit });
    if (type && type !== "All") params.append("type", type);
    const response = await api.get(`/products/promotions?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching promotions:", error);
    throw error;
  }
};

export const createPromotion = async (promotionData) => {
  try {
    const response = await api.post("/products/promotions", promotionData);
    return response.data;
  } catch (error) {
    console.error("Error creating promotion:", error);
    throw error;
  }
};

export const updatePromotion = async (id, promotionData) => {
  try {
    const response = await api.put(`/products/promotions/${id}`, promotionData);
    return response.data;
  } catch (error) {
    console.error("Error updating promotion:", error);
    throw error;
  }
};

export const deletePromotion = async (id) => {
  try {
    const response = await api.delete(`/products/promotions/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting promotion:", error);
    throw error;
  }
};
