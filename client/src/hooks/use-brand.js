import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BrandApi from "@/apis/brandApi";
import { notify } from "@/lib/notify";

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
      notify.success("Brand created successfully");
    },
    onError: (error) => {
      notify.apiError(error, "Failed to create brand");
    },
  })
  const updateMutation=useMutation({
    mutationFn:({id,data})=>BrandApi.updateBrand(id,data),
     onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      notify.success("Brand updated successfully");
    },
    onError: (error) => {
      notify.apiError(error, "Failed to update brand");
    },
  })
  const deleteMutation=useMutation({
    mutationFn:(id)=>BrandApi.deleteBrand(id),
     onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      notify.success("Brand deleted successfully");
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete brand");
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