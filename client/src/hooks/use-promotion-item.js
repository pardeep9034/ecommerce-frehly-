import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPromotionItems, fetchAllPromotionItems, addPromotionItem, removePromotionItem } from "../apis/promotionItemApi";
import toast from "react-hot-toast";

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
            toast.success("Product added to promotion successfully!");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to add product to promotion");
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
            toast.success("Product removed from promotion");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to remove product from promotion");
        },
    });
};
