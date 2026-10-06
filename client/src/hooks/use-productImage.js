import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ProductImageApi from "@/apis/productImageApi";

const useProductImage = (productId) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["productImages", productId],
    queryFn: () => ProductImageApi.getImagesByProductId(productId),
    enabled: !!productId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["productImages", productId] });

  const addImage = useMutation({
    mutationFn: (payload) => ProductImageApi.addImage({ product_id: Number(productId), ...payload }),
    onSuccess: invalidate,
  });

  const deleteImage = useMutation({
    mutationFn: (id) => ProductImageApi.deleteImage(id),
    onSuccess: invalidate,
  });

  const setPrimaryImage = useMutation({
    mutationFn: (id) => ProductImageApi.setPrimaryImage(id),
    onSuccess: invalidate,
  });

  return {
    images: data?.data?.images || [],
    isLoading,
    addImage,
    deleteImage,
    setPrimaryImage,
  };
};

export default useProductImage;
