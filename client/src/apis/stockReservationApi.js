import api from "./axiosInstance";

const stockResrvationApi={
    // `status` (ACTIVE | CONFIRMED | RELEASED | EXPIRED) is filtered server-side; omit for all.
    async getAllReservation(page,limit,status){
        const response= await api.get("/stock-reservations",{params:{page,limit,status}})
        return response.data;

    },
    async create(data){
        const response= await api.post("/stock-reservations",data);
        return response.data;
    },
    async release(id){
        const response= await api.patch(`/stock-reservations/${id}/release`)
        return response.data;
    },
    async confirm(id){
        const response= await api.patch(`/stock-reservations/${id}/confirm`)
        return response.data;
    }
    
}
export default stockResrvationApi;