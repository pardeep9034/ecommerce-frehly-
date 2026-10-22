import api from "./axiosInstance";

// config-service: store settings, admins only. GET answers every group with defaults filled in;
// PATCH saves only the fields sent for one group ("general" or "orderRules") and answers the whole group.
const configApi = {
  async getAll() {
    return (await api.get("/config")).data.data;
  },

  async save(group, changes) {
    return (await api.patch(`/config/${group}`, changes)).data.data;
  },
};

export default configApi;
