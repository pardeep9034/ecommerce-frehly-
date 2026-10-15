import api from "./axiosInstance";

const DeliveryApi = {
  async fetchAvailablePartners() {
    const response = await api.get("/delivery-partners");
    return response.data;
  },
  // Dashboard list: params are search, zone_id, status, online, page, limit.
  async fetchPartners(params) {
    const response = await api.get("/delivery-partners/list", { params });
    return response.data;
  },
  // How a partner came on (staff only): { partner, application | null, documents, events }.
  async fetchOnboarding(partnerId) {
    const response = await api.get(`/delivery-partners/${partnerId}/onboarding`);
    return response.data.data;
  },
  async fetchDeliverySlots() {
    const response = await api.get("/delivery-slots");
    return response.data;
  },
  async assignOrder(payload) {
    const response = await api.post("/handle-orders/assignments/assign", payload);
    return response.data;
  },
};

export default DeliveryApi;
