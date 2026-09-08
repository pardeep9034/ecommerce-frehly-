import api from "./axiosInstance";

const VariantApi = {
    async createVariant(productId, variantData) {
        const response = await api.post(`/product-variant/${productId}/variants`, variantData);
        return response.data;
    },
    async getAllVariants(productId) {
        const response = await api.get(`/product-variant/${productId}/variants`);
        return response.data;
    },
    async variantsInfo(variantIds) {
        const response = await api.post(`/product-variant/variants/by-ids`,{
            variantIds: variantIds
        });
        console.log("variantinfo",response.data)
        return response.data;
    },
    async getVariantById(id) {
        const response = await api.get(`/product-variant/variants/${id}`);
        return response.data;
    },
    async updateVariant(id, variantData) {
        const response = await api.put(`/product-variant/variants/${id}`, variantData);
        return response.data;
    },
    async deleteVariant(id) {
        const response = await api.delete(`product-variant/variants/${id}`);
        return response.data;
    }
};

export default VariantApi;
