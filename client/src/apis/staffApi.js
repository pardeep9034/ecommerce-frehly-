import api from "./axiosInstance";

const StaffApi = {
  async getAllStaff(page, limit, params = {}) {
    const response = await api.get("/auth/admin/users", { params: { page, limit, ...params } });
    return response.data;
  },
  async getStaffById(id) {
    const response = await api.get(`/auth/admin/users/${id}`);
    return response.data;
  },
  async createStaff(data) {
    const response = await api.post("/auth/admin/users", data);
    return response.data;
  },
  async updateStaff(id, data) {
    const response = await api.put(`/auth/admin/users/${id}`, data);
    return response.data;
  },
  async setStaffStatus(id, isActive) {
    const response = await api.patch(`/auth/admin/users/${id}/status`, { is_active: isActive });
    return response.data;
  },
  async resetStaffPassword(id, data) {
    const response = await api.post(`/auth/admin/users/${id}/reset-password`, data);
    return response.data;
  },
  async resendInvite(id) {
    const response = await api.post(`/auth/admin/users/${id}/resend-invite`);
    return response.data;
  },
};

export default StaffApi;
