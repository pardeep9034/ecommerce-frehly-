import PromotionRepository from "../repository/promotion.repository.js";

const PromotionServices = {
    async getAllPromotions(limit, offset, type) {
        try {
            const promotions = await PromotionRepository.getAllPromotions(limit, offset, type);
            return { success: true, data: promotions };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },
    async getPromotionById(id) {
        try {
            const promotion = await PromotionRepository.getPromotionById(id);
            return { success: true, data: promotion };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },
    async createPromotion(promotion) {
        try {
            const newPromotion = await PromotionRepository.createPromotion(promotion);
            return { success: true, data: newPromotion };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },
    async updatePromotion(id, promotion) {
        try {
            const updatedPromotion = await PromotionRepository.updatePromotion(id, promotion);
            return { success: true, data: updatedPromotion };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },
    async deletePromotion(id) {
        try {
            const deletedPromotion = await PromotionRepository.deletePromotion(id);
            return { success: true, data: deletedPromotion };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};

export default PromotionServices;