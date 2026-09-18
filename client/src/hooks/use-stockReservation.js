import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import stockResrvationApi from "@/apis/stockReservationApi";

const useStockResvation =({page,limit})=>{
const queryClient=useQueryClient();

const {data,isLoading,isError}=useQuery({queryKey:["stockReservation",page,limit],queryFn:()=>stockResrvationApi.getAllReservation(page,limit)});

const createMutation=useMutation({mutationFn:(data)=>stockResrvationApi.create(data),onSuccess:()=>{
    queryClient.invalidateQueries({queryKey:["stockReservation"]})
}})
const releaseMutation=useMutation({mutationFn:(data)=>stockResrvationApi.release(data),onSuccess:()=>{
    queryClient.invalidateQueries({queryKey:["stockReservation"]})
}})
const confirmMutation=useMutation({mutationFn:(data)=>stockResrvationApi.confirm(data),onSuccess:()=>{
    queryClient.invalidateQueries({queryKey:["stockReservation"]})
}})


return {
    data,
    isLoading,
    isError,
    createMutation,
    releaseMutation,
    confirmMutation

}

}
export default useStockResvation;