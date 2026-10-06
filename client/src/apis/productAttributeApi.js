import api from "./axiosInstance";
const productAttributeApi={
    // filters: { product_id, is_filterable, search } — empty values are dropped by axios
    async getAllProductAttribute(page,limit,filters={}){
        const response=await api.get("/product-attribute",{params:{page,limit,...filters}})
        return response.data;

    } ,
      async createProductAttribute(data){
        const response =await api.post("/product-attribute",data);
        return response.data;
    },

    async updateProductAttribute(id,data){
        const response=await api.put(`/product-attribute/${id}`,data);
        return response.data;

    },
    async deleteProductAttribute(id){
        const response=await api.delete(`/product-attribute/${id}`)
        return response.data;
    },
    async getByProductId(productId){
        const response=await api.get(`/product-attribute/product/${productId}`)
        return response.data;
    }
}

export default productAttributeApi;