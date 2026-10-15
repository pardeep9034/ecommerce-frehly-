import api from "./axiosInstance";

// Not /auth/admin/users: that path is already the customers list (adminUser module, used by customerApi.js).
// Until the backend ships these routes every call 404s and the Staff pages show their demo data.
const BASE = "/auth/admin/staff";

const StaffApi = {
  async getAllStaff(page, limit, params = {}) {
    const response = await api.get(BASE, { params: { page, limit, ...params } });
    return response.data;
  },
  async getStaffById(id) {
    const response = await api.get(`${BASE}/${id}`);
    return response.data;
  },
  async createStaff(data) {
    const response = await api.post(BASE, data);
    return response.data;
  },
  async updateStaff(id, data) {
    const response = await api.put(`${BASE}/${id}`, data);
    return response.data;
  },
  async setStaffStatus(id, isActive) {
    const response = await api.patch(`${BASE}/${id}/status`, { is_active: isActive });
    return response.data;
  },
  async resetStaffPassword(id, data) {
    const response = await api.post(`${BASE}/${id}/reset-password`, data);
    return response.data;
  },
  async resendInvite(id) {
    const response = await api.post(`${BASE}/${id}/resend-invite`);
    return response.data;
  },
};

export default StaffApi;
