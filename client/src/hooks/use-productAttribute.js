import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import productAttributeApi from "@/apis/productAttributeApi";
const useProductAttribute=(page=1,limit=10,brandId)=>{
    const queryClient=useQueryClient();
      const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["productAttributes", page, limit],
    queryFn: () => productAttributeApi.getAllProductAttribute(page, limit),
  });
  const createMutation=useMutation({
    mutationFn:(data)=>productAttributeApi.createProductAttribute(data),
     onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productAttributes"] });
    },
  })
  const updateMutation=useMutation({
    mutationFn:({id,data})=>productAttributeApi.updateProductAttribute(id,data),
     onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productAttributes"] });
    },
  })
  const deleteMutation=useMutation({
    mutationFn:(id)=>productAttributeApi.deleteProductAttribute(id),
     onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productAttributes"] });
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
export default useProductAttribute;