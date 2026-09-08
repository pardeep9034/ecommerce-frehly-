import api from "./axiosInstance";

const unitApi={
    async getAllUnits(page,limit){
        const response=await api.get(`/units?page=${page}&limit=${limit}`);
        return response.data;
    },
    async createUnit(data){
        const response =await api.post("/units",data);
        return response.data;
    },

    async updateUnit(unitId,data){
        const response=await api.put(`/units/${unitId}`,data);
        return response.data;

    },
    async deleteUnit(unitId){
        const response=await api.delete(`/units/${unitId}`)
        return response.data;
    }
}

export default unitApi;