import api from "./axiosInstance";

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

  // `number` and `expiry_date` ride along with the file. axios would send FormData as JSON under the
  // instance's default Content-Type, so multipart has to be named here.
  async uploadDocument(type, file, { number, expiry_date } = {}) {
    const form = new FormData();
    if (number) form.append("number", number);
    if (expiry_date) form.append("expiry_date", expiry_date);
    form.append("file", file);
    const response = await api.put(`${BASE}/me/documents/${type}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
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
