import api from "./axiosInstance";

// notification-service: the signed-in admin's email preferences, ADMIN / SUPER_ADMIN only.
// Both answer { warehousePauses, partnerApplies, failedPayments, dailySummary, hasEmail }; PATCH takes any subset of the four booleans.
const notificationApi = {
  async getPreferences() {
    return (await api.get("/notifications/preferences/me")).data.data;
  },

  async updatePreferences(changes) {
    return (await api.patch("/notifications/preferences/me", changes)).data.data;
  },
};

export default notificationApi;
