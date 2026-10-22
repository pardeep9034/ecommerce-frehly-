import api from "./axiosInstance";

// Except getOrder, none of these endpoints exist yet — see STORE_OPERATIONS_MODULE.md
// for the full contract. Every call resolves "me"/"my warehouse" server-side from the
// caller's JWT, never from a client-supplied warehouse or staff id.
const StoreApi = {
  // ponytail: the existing GET /orders/:id. Only ADMIN gets in (OPS_STAFF is 403) and it is
  // not limited to the caller's warehouse; move to /store/me/orders/:id when that exists.
  async getOrder(orderId) {
    const response = await api.get(`/orders/${orderId}`);
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
