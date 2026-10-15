import api from "./axiosInstance";
import { documentForm, MULTIPART } from "./documentForm";

const BASE = "/delivery-partners/applications";
const unwrap = (response) => response.data.data;

// Staff side of the partner applications. Every write answers with the whole fresh detail (it carries `version`).
const partnerReviewApi = {
  async list(params) {
    return unwrap(await api.get(BASE, { params }));
  },

  // { waiting, oldest_submitted_at, by_status } for the stat card and the sidebar badge.
  async summary() {
    return unwrap(await api.get(`${BASE}/summary`));
  },

  async get(id) {
    return unwrap(await api.get(`${BASE}/${id}`));
  },

  // Adds someone as a draft and texts them an invite. Answers with the staff detail plus `invite_sent`.
  async createOnBehalf(body) {
    return unwrap(await api.post(`${BASE}/on-behalf`, body));
  },

  // Staff fill in the draft they created: upload a file (with its number / expiry), then submit with the attestation (P3-1).
  async uploadDocument(id, type, file, fields) {
    return unwrap(await api.put(`${BASE}/${id}/documents/${type}`, documentForm(file, fields), MULTIPART));
  },

  async submit(id) {
    return unwrap(await api.post(`${BASE}/${id}/submit`, { consent_attested: true }));
  },

  async startReview(id) {
    return unwrap(await api.post(`${BASE}/${id}/start-review`));
  },

  // The server answers with a path on the API; the file route takes no bearer token, so the browser can load it in <img>/<iframe>.
  async documentUrl(id, type) {
    const { url, expires_at } = unwrap(await api.get(`${BASE}/${id}/documents/${type}/url`));
    return { url: `${import.meta.env.VITE_API_BASE_URL}${url}`, expires_at };
  },

  async verifyDocument(id, type, body = {}) {
    return unwrap(await api.post(`${BASE}/${id}/documents/${type}/verify`, body));
  },

  async requestReupload(id, type, reason) {
    return unwrap(await api.post(`${BASE}/${id}/documents/${type}/request-reupload`, { reason }));
  },

  async setCheck(id, key, body) {
    return unwrap(await api.put(`${BASE}/${id}/checks/${key}`, body));
  },

  async addNote(id, text) {
    return unwrap(await api.post(`${BASE}/${id}/notes`, { text }));
  },

  async requestChanges(id, body) {
    return unwrap(await api.post(`${BASE}/${id}/request-changes`, body));
  },

  async reject(id, body) {
    return unwrap(await api.post(`${BASE}/${id}/reject`, body));
  },

  async approve(id, body) {
    return unwrap(await api.post(`${BASE}/${id}/approve`, body));
  },
};

export default partnerReviewApi;
