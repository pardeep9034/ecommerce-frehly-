import api from "./axiosInstance";

const InventoryApi = {
  async fetchAllInventory(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const response = await api.get(`/inventory?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  async fetchInventoryByProductId(productId) {
    const response = await api.get(`/inventory/product/${productId}`);
    return response.data;
  },

  async createInventory(inventoryData) {
    const response = await api.post("/inventory", inventoryData);
    return response.data;
  },

  async updateInventory(id, inventoryData) {
    const response = await api.put(`/inventory/${id}`, inventoryData);
    return response.data;
  },

  async deleteInventory(id) {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },

  async increaseStock(variantId, quantity) {
    const response = await api.post(`/inventory/increase/${variantId}`, { quantity });
    return response.data;
  },

  async decreaseStock(variantId, quantity) {
    const response = await api.post(`/inventory/decrease/${variantId}`, { quantity });
    return response.data;
  },

  async fetchAllVariants() {
    const response = await api.get("/variants");
    return response.data;
  },
};

export default InventoryApi;
