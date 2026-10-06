import { keepPreviousData,useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import stockResrvationApi from "@/apis/stockReservationApi";

const useStockResvation =({page,limit,status})=>{
const queryClient=useQueryClient();

// `data.data.statusCounts` (whole table, per status) comes back with every page, for the stat cards.
const {data,isLoading,isError}=useQuery({queryKey:["stockReservation",page,limit,status],queryFn:()=>stockResrvationApi.getAllReservation(page,limit,status),placeholderData:keepPreviousData});

// Only for "Release expired now": the ACTIVE reservations, so it can find the past-expiry ones.
const {data: statsData} = useQuery({queryKey:["stockReservation","stats"],queryFn:()=>stockResrvationApi.getAllReservation(1,1000,"ACTIVE")});

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
    statsData,
    isLoading,
    isError,
    createMutation,
    releaseMutation,
    confirmMutation

}

}
export default useStockResvation;