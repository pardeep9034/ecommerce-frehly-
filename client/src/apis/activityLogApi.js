import api from "./axiosInstance";

const unwrap = (response) => response.data.data;

// Read-only logs for the admin Activity log page. Both answer { events, pagination, meta } and are for ADMIN / SUPER_ADMIN only.
// Params: group, hours (1 | 24 | 168 | 720), search, page, limit.
const activityLogApi = {
  // auth-service: sign-in, sign-out, password reset, block and unblock.
  async security(params) {
    return unwrap(await api.get("/auth/admin/audit-logs", { params }));
  },

  // delivery-service: partner application events across all applications.
  async onboarding(params) {
    return unwrap(await api.get("/delivery-partners/applications/events", { params }));
  },
};

export default activityLogApi;
