import  initializeModels  from "../../models/index.js";

const PromotionRepository = {
    async getAllPromotions(limit = 10, offset = 0, type = null) {
        try {
            const db = await initializeModels();
            const promotions = await db.Promotion.findAll({
                limit,
                offset,
                where: type && type !== "All" ? { type } : undefined
            });
            return promotions;
        } catch (error) {
            throw error;
        }
    },
    async getPromotionById(id) {
        try {
            const db = await initializeModels();
            const promotion = await db.Promotion.findByPk(id);
            return promotion;
        } catch (error) {
            throw error;
        }
    },
    async createPromotion(promotion) {
        try {
            const db = await initializeModels();
            const newPromotion = await db.Promotion.create(promotion);
            return newPromotion;
        } catch (error) {
            throw error;
        }
    },
    async updatePromotion(id, promotion) {
        try {
            const db = await initializeModels();
            const updatedPromotion = await db.Promotion.update(promotion, { where: { id } });
            return updatedPromotion;
        } catch (error) {
            throw error;
        }
    },
    async deletePromotion(id) {
        try {
            const db = await initializeModels();
            const deletedPromotion = await db.Promotion.destroy({ where: { id } });
            return deletedPromotion;
        } catch (error) {
            throw error;
        }
    }
};

export default PromotionRepository;