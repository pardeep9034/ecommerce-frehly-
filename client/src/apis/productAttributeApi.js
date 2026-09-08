import api from "./axiosInstance";
const productAttributeApi={
    async getAllProductAttribute(page,limit){
        const response=await api.get(`/product-attribute?page=${page}&limit=${limit}`)
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
    }
}

export default productAttributeApi;