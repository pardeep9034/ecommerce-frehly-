import api from "./axiosInstance";


const deliveryZoneApi = {
  async fetchAllDeliveryZones(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const response = await api.get(`/delivery-zones?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  async fetchDeliveryZoneById(id) {
    const response = await api.get(`/delivery-zones/${id}`);
    return response.data;
  },

  async createDeliveryZone(data) {
    const response = await api.post("/delivery-zones", data);
    return response.data;
  },

  async updateDeliveryZone(id, data) {
    const response = await api.put(`/delivery-zones/${id}`, data);
    return response.data;
  },

  async deleteDeliveryZone(id) {
    const response = await api.delete(`/delivery-zones/${id}`);
    return response.data;
  } 
};

export default deliveryZoneApi;