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
  async getAssignments({ status, date, page = 1, limit = 20 } = {}) {
    const response = await api.get("/delivery-partners/me/assignments", {
      params: { status, date, page, limit },
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
};

export default PartnerApi;
