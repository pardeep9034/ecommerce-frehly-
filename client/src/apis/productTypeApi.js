import api from "./axiosInstance";
const productTypeApi={
    async getAllProductTypes(page,limit){
        const response=await api.get(`/product-type?page=${page}&limit=${limit}`)
        return response.data;

    } ,
      async createProductType(data){
        const response =await api.post("/product-type",data);
        return response.data;
    },

    async updateProductType(id,data){
        const response=await api.put(`/product-type/${id}`,data);
        return response.data;

    },
    async deleteProductType(id){
        const response=await api.delete(`/product-type/${id}`)
        return response.data;
    }
}

export default productTypeApi;