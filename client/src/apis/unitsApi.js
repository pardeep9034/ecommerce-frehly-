import api from "./axiosInstance";

const unitApi={
    // filters: { search, category } — empty values are dropped by axios
    async getAllUnits(page,limit,filters={}){
        const response=await api.get("/units",{params:{page,limit,...filters}});
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