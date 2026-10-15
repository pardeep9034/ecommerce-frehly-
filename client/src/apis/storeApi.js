import api from "./axiosInstance";

// None of these endpoints exist yet — see STORE_OPERATIONS_MODULE.md for the
// full contract. Every call resolves "me"/"my warehouse" server-side from the
// caller's JWT, never from a client-supplied warehouse or staff id.
const StoreApi = {
  async getMe() {
    const response = await api.get("/store/me");
    return response.data;
  },
  async getQueue({ stage, search } = {}) {
    const response = await api.get("/store/me/queue", { params: { stage, search } });
    return response.data;
  },
  async getOrder(orderId) {
    const response = await api.get(`/store/me/orders/${orderId}`);
    return response.data;
  },
  // Item-level pick status reuses the same shape as the existing admin
  // endpoint (OrderApi.updateOrderItemStatus) — see doc point 1.
  async updateItemStatus(orderId, itemId, payload) {
    const response = await api.patch(`/store/me/orders/${orderId}/items/${itemId}/status`, payload);
    return response.data;
  },
  async finalizeItems(orderId) {
    const response = await api.post(`/store/me/orders/${orderId}/items/finalize`);
    return response.data;
  },
  async packOrder(orderId, payload) {
    // payload: { bag_count, rack_label }
    const response = await api.post(`/store/me/orders/${orderId}/pack`, payload);
    return response.data;
  },
  async getAvailableRiders(orderId) {
    const response = await api.get(`/store/me/orders/${orderId}/available-riders`);
    return response.data;
  },
  async assignRider(orderId, deliveryPartnerId) {
    const response = await api.post(`/store/me/orders/${orderId}/assign-rider`, { delivery_partner_id: deliveryPartnerId });
    return response.data;
  },
  async getHandovers() {
    const response = await api.get("/store/me/handovers");
    return response.data;
  },
  async confirmHandover(orderId, pickupCode) {
    const response = await api.post(`/store/me/orders/${orderId}/handover`, { pickup_code: pickupCode });
    return response.data;
  },
};

export default StoreApi;
