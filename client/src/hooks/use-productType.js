import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import productTypeApi from "../apis/productTypeApi"
const useProductType=(page=1,limit=10,brandId)=>{
    const queryClient=useQueryClient();
      const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["productTypes", page, limit],
    queryFn: () => productTypeApi.getAllProductTypes(page, limit),
  });
  const createMutation=useMutation({
    mutationFn:(data)=>productTypeApi.createProductType(data),
     onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productTypes"] });
    },
  })
  const updateMutation=useMutation({
    mutationFn:({id,data})=>productTypeApi.updateProductType(id,data),
     onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productTypes"] });
    },
  })
  const deleteMutation=useMutation({
    mutationFn:(id)=>productTypeApi.deleteProductType(id),
     onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productTypes"] });
    },
  })
  return {
    data,
    isLoading,
    error,
    createMutation,
    updateMutation,
    deleteMutation

  }
}
export default useProductType;