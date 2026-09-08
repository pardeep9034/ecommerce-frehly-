import api from "./axiosInstance";

const WarehouseApi = {
  async getAllWarehouses() {
    const response = await api.get("/warehouses");
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
