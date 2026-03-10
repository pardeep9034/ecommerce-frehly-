import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import VariantApi from "@/apis/variantApi";

const useVariant = (productId) => {
  const queryClient = useQueryClient();

  // GET - fetch all variants for a product
  const {
    data: variantsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["variants", productId],
    queryFn: () => VariantApi.getAllVariants(productId),
    enabled: !!productId,
  });

  // POST - create variant
  const createMutation = useMutation({
    mutationFn: (data) => VariantApi.createVariant(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variants", productId] });
      // Invalidate the parent product to update any embedded variants if needed
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
  });

  // PUT - update variant
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => VariantApi.updateVariant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variants", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
  });

  // DELETE - delete variant
  const deleteMutation = useMutation({
    mutationFn: (id) => VariantApi.deleteVariant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variants", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
  });

  return {
    variants: variantsData?.data || [],
    isLoading,
    error,
    createVariant: createMutation,
    updateVariant: updateMutation,
    deleteVariant: deleteMutation,
  };
};

export default useVariant;
