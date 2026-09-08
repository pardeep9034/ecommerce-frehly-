import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query";
import warehouseApi from "@/apis/warehouseApi";
const useWarehouse=(page,limit,warehouseId)=>{
const queryClient=useQueryClient();

// GET - fetch all warehouses
const {data:warehousesData,isLoading,error}=useQuery({
    queryKey:["warehouses",page,limit],
    queryFn:()=>warehouseApi.getAllWarehouses(page,limit),
    enabled:!!page && !!limit
});
// POST - create warehouse
const createMutation=useMutation({
    mutationFn:(data)=>warehouseApi.createWarehouse(data),
    onSuccess:()=>{
        queryClient.invalidateQueries({queryKey:["warehouses"]});
    }   
});
// PUT - update warehouse
const updateMutation=useMutation({
    mutationFn:({id,data})=>warehouseApi.updateWarehouse(id,data),
    onSuccess:()=>{
        queryClient.invalidateQueries({queryKey:["warehouses"]});
    }
});
// DELETE - delete warehouse
const deleteMutation=useMutation({
    mutationFn:(id)=>warehouseApi.deleteWarehouse(id),
    onSuccess:()=>{
        queryClient.invalidateQueries({queryKey:["warehouses"]});
    }   
});
return {
    warehouses:warehousesData?.data?.warehouses??[],
    pagination:warehousesData?.data?.pagination??{},
    isLoading,
    error,
    createMutation,
    updateMutation,
    deleteMutation
}
}
export default useWarehouse;