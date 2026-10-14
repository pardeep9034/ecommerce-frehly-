import api from "./axiosInstance";

// Delivery-partner "me" endpoints — scoped to the logged-in partner via
// their JWT, never a partner id in the URL. None of these exist on the
// backend yet; see DELIVERY_PARTNER_MODULE.md for the contract this file
// assumes.
const PartnerApi = {
  async getMe() {
    const response = await api.get("/delivery-partners/me");
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
