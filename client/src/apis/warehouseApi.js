import api from "./axiosInstance";

const WarehouseApi = {
  async getAllWarehouses(page, limit) {
    const response = await api.get("/warehouses", { params: { page, limit } });
    return response.data;
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
  async updateWarehouseSettings(id, data) {
    const response = await api.patch(`/warehouses/${id}/settings`, data);
    return response.data;
  },
  async getWarehouseTeam(id) {
    const response = await api.get(`/warehouses/${id}/team`);
    return response.data;
  },
  async assignWarehouseStaff(id, userId) {
    const response = await api.post(`/warehouses/${id}/team`, { user_id: userId });
    return response.data;
  },
  async removeWarehouseStaff(id, userId) {
    const response = await api.delete(`/warehouses/${id}/team/${userId}`);
    return response.data;
  },
};

export default WarehouseApi;
