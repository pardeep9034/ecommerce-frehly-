import api from "./axiosInstance";

const stockResrvationApi={
    // All filters run server-side and are optional: `status` (ACTIVE | CONFIRMED | RELEASED | EXPIRED),
    // `warehouseId`, and `search` (order id or product name).
    async getAllReservation(page,limit,{status,warehouseId,search}={}){
        const response= await api.get("/stock-reservations",{params:{page,limit,status,warehouse_id:warehouseId,search}})
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