import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query";
import unitApi from "@/apis/unitsApi";

const useUnits=(page,limit)=>{
      const queryClient = useQueryClient();
const {
    data:unitsData,
    isLoading,
    error,
}=useQuery({
    queryKey:['units',page,limit],
    queryFn:()=>unitApi.getAllUnits(page,limit),
     placeholderData: (previousData) => previousData,

})
  const createMutation = useMutation({
    mutationFn: (data) => unitApi.createUnit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });
  const updateMutation=useMutation({
    mutationFn:({id,data})=>unitApi.updateUnit(id,data),
    onSuccess:()=>{
        queryClient.invalidateQueries({queryKey:["units"]})
    }
  });
  const deleteMutation=useMutation({
    mutationFn:(id)=>unitApi.deleteUnit(id),
    onSuccess:()=>{
        queryClient.invalidateQueries({queryKey:["units"]})
    }
  })
return {
    unitsData,
    isLoading,
    error,
   createMutation,
    updateMutation,
   deleteMutation
}
}

export default useUnits