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
    // filters: { category_id, brand_id, search } — empty values are dropped by axios
    async getAllProducts(page = 1, limit = 10, status, filters = {}) {
        const response = await api.get("/product", { params: { page, limit, status, ...filters } });
        return response.data;
    },
    // Home page strips: storefront rules (ACTIVE products with their ACTIVE variants).
    async getProductsByType(type, page = 1, limit = 10) {
        const response = await api.get(`/product?page=${page}&limit=${limit}&storefront=true`);
        return response.data;
    },
    // storefront: 404 unless the product is ACTIVE with an ACTIVE variant; only those variants come back.
    async getProductById(id, { storefront } = {}) {
        const response = await api.get(`/product/${id}`, { params: { storefront: storefront || undefined } });
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