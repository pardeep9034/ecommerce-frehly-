import api from "./axiosInstance";

const ProductApi = {
    async productSelection(search="",page,limit){
        const response=await api.get(`/product/selection?page=${page}&limit=${limit}&search=${search}`)
        return response.data;
    },
    async createProduct(productData) {
        const response = await api.post("/product", productData);
        return response.data;
    },
    async searchVariants(search = "") {
        const response = await api.get(`/product/search?name=${search}`);
        return response.data;
    },
    async getAllProducts(page = 1, limit = 10, status) {
        const response = await api.get(`/product?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}`);
        return response.data;
    },
    async getProductsByType(type, page = 1, limit = 10) {
        const response = await api.get(`/product?page=${page}&limit=${limit}`);
        return response.data;
    },
    async getProductById(id) {
        const response = await api.get(`/product/${id}`);
        console.log("product by id",response.data);
        
        return response.data;
    },
    async getProductByCategory(catId,page,limit){
        const response= await api.get(`/product/category?category=${catId}&page=${page}&limit=${limit}`)
        return response.data;

    },
    async updateProduct(id, productData) {
        const response = await api.put(`/product/${id}`, productData);
        return response.data;
    },
    async deleteProduct(id) {
        const response = await api.delete(`/product/${id}`);
        return response.data;
    }
    
};

export default ProductApi;