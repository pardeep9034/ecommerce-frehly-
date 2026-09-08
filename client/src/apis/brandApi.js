import api from "./axiosInstance";
const brandApi={
    async getAllBrands(page,limit){
        const response=await api.get(`/brand?page=${page}&limit=${limit}`)
        return response.data;

    } ,
      async createBrand(data){
        const response =await api.post("/brand",data);
        return response.data;
    },

    async updateBrand(unitId,data){
        const response=await api.put(`/brand/${unitId}`,data);
        return response.data;

    },
    async deleteBrand(unitId){
        const response=await api.delete(`/brand/${unitId}`)
        return response.data;
    }
}

export default brandApi;