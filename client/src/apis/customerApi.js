import api from "./axiosInstance";

const customerApi = {
  // filters: { search, status: "active" | "blocked", joined_days, id } — empty values are dropped by axios
  async getCustomers(page, limit, filters = {}) {
    const response = await api.get("/auth/admin/users", { params: { page, limit, ...filters } });
    return response.data;
  },

  // Block (is_active: false) or unblock a customer. Blocking also signs them out.
  async setCustomerStatus(customerId, isActive) {
    const response = await api.patch(`/auth/admin/users/${customerId}/status`, { is_active: isActive });
    return response.data;
  },

  // Order count / spend / recent orders for these customer ids, plus store-wide summary figures.
  async getCustomerStats(userIds = []) {
    const response = await api.get("/orders/admin/customer-stats", { params: { user_ids: userIds.join(",") || undefined } });
    return response.data;
  },
};

export default customerApi;
