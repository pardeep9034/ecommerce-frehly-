import api from "./axiosInstance";


const deliveryZoneApi = {
  // filters: { city?, search? }, applied by the server before paging.
  async fetchAllDeliveryZones(page = 1, limit = 10, filters = {}) {
    const response = await api.get("/delivery-zones", { params: { page, limit, ...filters } });
    return response.data;
  },

  // Every city that has a zone, A to Z: { cities: [] }.
  async fetchCities() {
    const response = await api.get("/delivery-zones/cities");
    return response.data.data.cities;
  },

  // { pincode } and/or { lat, lng } -> { serviceable, warehouse_id, area, city, estimated_delivery_time, ... }
  async checkServiceability(params) {
    const response = await api.get("/delivery-zones/serviceability", { params });
    return response.data.data;
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