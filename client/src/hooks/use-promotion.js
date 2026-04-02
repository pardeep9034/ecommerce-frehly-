import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "@/apis/promotionApi";

const usePromotion = (page = 1, limit = 10, type = null) => {
  const queryClient = useQueryClient();

  const {
    data: promotions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["promotions", page, limit, type],
    queryFn: () => fetchPromotions(page, limit, type),
  });

  const createMutation = useMutation({
    mutationFn: (data) => createPromotion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updatePromotion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
    },
  });

  return {
    promotions,
    isLoading,
    error,
    createPromotion: createMutation,
    updatePromotion: updateMutation,
    deletePromotion: deleteMutation,
  };
};

export default usePromotion;
