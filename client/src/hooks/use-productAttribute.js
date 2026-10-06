import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import productAttributeApi from "@/apis/productAttributeApi";
const useProductAttribute=(page=1,limit=10,filters={})=>{
    const queryClient=useQueryClient();
      const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["productAttributes", page, limit, filters.product_id, filters.is_filterable, filters.search],
    queryFn: () => productAttributeApi.getAllProductAttribute(page, limit, filters),
    placeholderData: keepPreviousData,
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