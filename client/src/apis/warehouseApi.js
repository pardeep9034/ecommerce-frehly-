import api from "./axiosInstance";

const WarehouseApi = {
  // filters: { city? }, applied by the server before paging.
  async getAllWarehouses(page, limit, filters = {}) {
    const response = await api.get("/warehouses", { params: { page, limit, ...filters } });
    return response.data;
  },
  // Every city that has a warehouse, A to Z.
  async getCities() {
    const response = await api.get("/warehouses/cities");
    return response.data.data.cities;
  },
  async getWarehouseById(id) {
    const response = await api.get(`/warehouses/${id}`);
    return response.data;
  },
  async createWarehouse(data) {
    const response = await api.post("/warehouses", data);
    return response.data;
  },
  async updateWarehouse(id, data) {
    const response = await api.put(`/warehouses/${id}`, data);
    return response.data;
  },
  async deleteWarehouse(id) {
    const response = await api.delete(`/warehouses/${id}`);
    return response.data;
  },
};

export default WarehouseApi;
