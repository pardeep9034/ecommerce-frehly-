import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BrandApi from "@/apis/brandApi";

const useBrand=(page=1,limit=10,brandId)=>{
    const queryClient=useQueryClient();
      const {
    data: brandsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["brands", page, limit],
    queryFn: () => BrandApi.getAllBrands(page, limit),
  });
  const createMutation=useMutation({
    mutationFn:(data)=>BrandApi.createBrand(data),
     onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  })
  const updateMutation=useMutation({
    mutationFn:({id,data})=>BrandApi.updateBrand(id,data),
     onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  })
  const deleteMutation=useMutation({
    mutationFn:(id)=>BrandApi.deleteBrand(id),
     onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  })
  return {
    brandsData,
    isLoading,
    error,
    createMutation,
    updateMutation,
    deleteMutation

  }
}
export default useBrand;