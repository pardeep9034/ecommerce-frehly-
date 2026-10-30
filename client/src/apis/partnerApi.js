import api from "./axiosInstance";

// Delivery-partner "me" endpoints — scoped to the logged-in partner via
// their JWT, never a partner id in the URL. Contract: DELIVERY_PARTNER_MODULE.md.
const PartnerApi = {
  async getMe() {
    const response = await api.get("/delivery-partners/me");
    return response.data;
  },
  // A state, not a flip: sending the same value twice (a retry, a double tap) changes nothing the second time.
  async setOnline(online) {
    const response = await api.patch("/delivery-partners/me/online", { online });
    return response.data;
  },
  // from / to are "YYYY-MM-DD" IST days; search is an order number or part of the customer's name.
  async getAssignments({ status, date, from, to, search, page = 1, limit = 20 } = {}) {
    const response = await api.get("/delivery-partners/me/assignments", {
      params: { status, date, from, to, search: search || undefined, page, limit },
    });
    return response.data;
  },
  async getAssignment(assignmentId) {
    const response = await api.get(`/delivery-partners/me/assignments/${assignmentId}`);
    return response.data;
  },
  async updateAssignmentStatus(assignmentId, payload) {
    const response = await api.patch(
      `/delivery-partners/me/assignments/${assignmentId}/status`,
      payload
    );
    return response.data;
  },
  // A return pickup at the customer's: collected (then take it to the store) or not.
  async finishPickup(assignmentId, collected) {
    const response = await api.patch(`/delivery-partners/me/assignments/${assignmentId}/pickup`, { collected });
    return response.data;
  },
  // The photo of what the customer turned away. Needed before "Delivered" with any item turned away.
  async uploadDoorPhoto(assignmentId, file) {
    const form = new FormData();
    form.append("file", file);
    const response = await api.post(`/delivery-partners/me/assignments/${assignmentId}/door-photo`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  // Pay on delivery by UPI. method: "POST" makes a QR for what is due (a second POST is "Retry": the old one is closed),
  // "GET" checks whether it was paid, "DELETE" closes it (switching to cash). Each answers { paid, amount, qr }.
  async doorQr(assignmentId, method, rejectedItems) {
    const response = await api.request({
      url: `/delivery-partners/me/assignments/${assignmentId}/door-qr`,
      method,
      ...(method === "POST" ? { data: { rejected_items: rejectedItems } } : {}),
    });
    return response.data;
  },
  // dir: "in" (handed to me) or "out" (handed on by me). Open ones plus today's finished ones.
  async getHandovers(dir) {
    const response = await api.get("/delivery-partners/me/handovers", { params: { dir } });
    return response.data;
  },
  // Who can take one of my open orders: same zone, online, room for one more.
  async getHandoverCandidates(assignmentId) {
    const response = await api.get("/delivery-partners/me/handovers/candidates", { params: { assignment_id: assignmentId } });
    return response.data;
  },
  // Start, confirm and call off live on /handle-orders (shared with staff); the token limits a partner to their own.
  async requestHandover(assignmentId, payload) {
    const response = await api.post(`/handle-orders/assignments/${assignmentId}/handover`, payload);
    return response.data;
  },
  // step: "confirm-handover" (giver), "confirm-receipt" (receiver) or "cancel" (either, before the receipt).
  async handoverStep(handoverId, step) {
    const response = await api.post(`/handle-orders/partner/handover/${handoverId}/${step}`, {});
    return response.data;
  },
};

export default PartnerApi;
