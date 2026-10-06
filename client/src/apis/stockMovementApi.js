import api from "./axiosInstance";

const stockMovementApi = {
//create stock movement
async createStockMovement(data) {
    const response = await api.post("/stock-movements", data);
    return response.data;
  },
  // filters: { type, warehouse_id } — undefined values are not sent
  async getAllStockMovements(page, limit, filters = {}) {
    const response = await api.get("/stock-movements", { params: { page, limit, ...filters } });
    return response.data;
  }


}

export default stockMovementApi;