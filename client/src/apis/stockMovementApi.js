import api from "./axiosInstance";

const stockMovementApi = {
//create stock movement
async createStockMovement(data) {
    const response = await api.post("/stock-movements", data);
    return response.data;
  },
  async getAllStockMovements(page, limit) {
    const response = await api.get(`/stock-movements?page=${page}&limit=${limit}`);
    return response.data;
  }


}

export default stockMovementApi;