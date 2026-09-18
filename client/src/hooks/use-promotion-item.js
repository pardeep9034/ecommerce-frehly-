import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPromotionItems, fetchAllPromotionItems, addPromotionItem, removePromotionItem } from "../apis/promotionItemApi";
import { notify } from "@/lib/notify";

export const usePromotionItemsQuery = (promotionId) => {
    return useQuery({
        queryKey: ["promotionItems", promotionId],
        queryFn: () => fetchPromotionItems(promotionId),
        enabled: !!promotionId, // Only fetch if promotionId is defined
    });
};

export const useAllPromotionItemsQuery = () => {
    return useQuery({
        queryKey: ["allPromotionItems"],
        queryFn: fetchAllPromotionItems,
    });
};

export const useAddPromotionItemMutation = (promotionId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (itemData) => addPromotionItem(promotionId, itemData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["promotionItems", promotionId] });
            notify.success("Product added to promotion successfully!");
        },
        onError: (error) => {
            notify.apiError(error, "Failed to add product to promotion");
        },
    });
};

export const useRemovePromotionItemMutation = (promotionId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => removePromotionItem(id),
        onSuccess: () => {
             // Invalidate precisely the promotionItems query to re-fetch
            queryClient.invalidateQueries({ queryKey: ["promotionItems", promotionId] });
            notify.success("Product removed from promotion");
        },
        onError: (error) => {
            notify.apiError(error, "Failed to remove product from promotion");
        },
    });
};
