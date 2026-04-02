import PromotionItemRepository from "../repository/promotionItem.repository.js";

const PromotionItemServices = {
    async getAllPromotionItems() {
        try {
            const items = await PromotionItemRepository.getAllPromotionItems();
            return { success: true, data: items };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async getPromotionItems(promotionId) {
        try {
            const items = await PromotionItemRepository.getPromotionItems(promotionId);
            return { success: true, data: items };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async addPromotionItem(promotionId, productId, variantId) {
        try {
            if (!promotionId || !productId) {
                return { success: false, message: "Promotion ID and Product ID are required" };
            }
            const item = await PromotionItemRepository.addPromotionItem(promotionId, productId, variantId);
            return { success: true, data: item };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async removePromotionItem(id) {
        try {
            const result = await PromotionItemRepository.removePromotionItem(id);
            if (result === 0) {
                 return { success: false, message: "Promotion item not found" };
            }
            return { success: true, data: { deleted: true } };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};

export default PromotionItemServices;
