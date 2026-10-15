import api from "./axiosInstance";
import { documentForm, MULTIPART } from "./documentForm";

const BASE = "/delivery-partners/applications";

const partnerApplicationApi = {
  async fetchMine() {
    const response = await api.get(`${BASE}/me`);
    return response.data.data;
  },

  async create(data) {
    const response = await api.post(BASE, data);
    return response.data.data;
  },

  // Applicant details while the application is still editable: { name, email, preferred_zone_id, vehicle_number }.
  async update(data) {
    const response = await api.patch(`${BASE}/me`, data);
    return response.data.data;
  },

  async uploadDocument(type, file, fields) {
    const response = await api.put(`${BASE}/me/documents/${type}`, documentForm(file, fields), MULTIPART);
    return response.data.data;
  },

  async submit() {
    const response = await api.post(`${BASE}/me/submit`, { consent: true });
    return response.data.data;
  },

  async resubmit() {
    const response = await api.post(`${BASE}/me/resubmit`);
    return response.data.data;
  },
};

export default partnerApplicationApi;
