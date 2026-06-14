import api from "./axiosInstance";

const ProductApi = {
    async createProduct(productData) {
        const response = await api.post("/products", productData);
        return response.data;
    },
    async searchVariants(search = "") {
        const response = await api.get(`/products/variants/search?search=${search}`);
        return response.data;
    },
    async getAllProducts(page = 1, limit = 10) {
        const response = await api.get(`/products?page=${page}&limit=${limit}`);
        return response.data;
    },
    async getProductsByType(type, page = 1, limit = 10) {
        const response = await api.get(`/products/type/${type}?page=${page}&limit=${limit}`);
        return response.data;
    },
    async getProductById(id) {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },
    async updateProduct(id, productData) {
        const response = await api.put(`/products/${id}`, productData);
        return response.data;
    },
    async deleteProduct(id) {
        const response = await api.delete(`/products/${id}`);
        return response.data;
    }
};

export default ProductApi;