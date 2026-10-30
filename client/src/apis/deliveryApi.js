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
  // A partner's 7-day stats and open jobs (staff only): { stats, active }.
  async fetchPartnerWork(partnerId) {
    const response = await api.get(`/delivery-partners/${partnerId}/work`);
    return response.data.data;
  },
  // Who is delivering an order (staff only): { assignment_id, status, assigned_at, partner, slot }, or null when never assigned.
  async fetchOrderAssignment(orderId) {
    const response = await api.get(`/handle-orders/assignments/by-order/${orderId}`);
    return response.data.data;
  },
  // Staff edit of the partner row: name, vehicle_type, vehicle_number, max_active_orders. The route also takes phone and
  // status, but the login phone lives in auth-service and status goes through suspend / activate, so the page sends neither.
  async updatePartner(partnerId, payload) {
    const response = await api.patch(`/delivery-partners/${partnerId}`, payload);
    return response.data.data;
  },
  async setPartnerSuspended(partnerId, suspend) {
    const response = await api.patch(`/delivery-partners/${partnerId}/${suspend ? "suspend" : "activate"}`);
    return response.data.data;
  },
  async fetchDeliverySlots() {
    const response = await api.get("/delivery-slots");
    return response.data;
  },
  async fetchAllSlots() {
    const response = await api.get("/delivery-slots/all");
    return response.data.data;
  },
  async createSlot(payload) {
    const response = await api.post("/delivery-slots", payload);
    return response.data.data;
  },
  async updateSlot(slotId, payload) {
    const response = await api.patch(`/delivery-slots/${slotId}`, payload);
    return response.data.data;
  },
  async assignOrder(payload) {
    const response = await api.post("/handle-orders/assignments/assign", payload);
    return response.data;
  },
};

export default DeliveryApi;
