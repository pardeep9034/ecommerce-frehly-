import api from "./axiosInstance";

const VariantApi = {
    async createVariant(productId, variantData) {
        const response = await api.post(`/${productId}/variants`, variantData);
        return response.data;
    },
    async getAllVariants(productId) {
        const response = await api.get(`/${productId}/variants`);
        return response.data;
    },
    async getVariantById(id) {
        const response = await api.get(`/variants/${id}`);
        return response.data;
    },
    async updateVariant(id, variantData) {
        const response = await api.put(`/variants/${id}`, variantData);
        return response.data;
    },
    async deleteVariant(id) {
        const response = await api.delete(`/variants/${id}`);
        return response.data;
    }
};

export default VariantApi;
