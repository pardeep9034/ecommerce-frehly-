import api from "./axiosInstance";

const ProductImageApi = {
    async getImagesByProductId(productId){
        const response = await api.get(`/product-image/product/${productId}`);
        return response.data;
    },
    async addImage(data){
        const response = await api.post("/product-image", data);
        return response.data;
    },
    async deleteImage(id){
        const response = await api.delete(`/product-image/${id}`);
        return response.data;
    },
    async setPrimaryImage(id){
        const response = await api.patch(`/product-image/${id}/set-primary`);
        return response.data;
    }
};

export default ProductImageApi;
