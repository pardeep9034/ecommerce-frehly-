import  initializeModels  from "../../models/index.js";

const PromotionItemRepository = {
    async getAllPromotionItems() {
        try {
            const db = await initializeModels();
            const items = await db.PromotionItem.findAll({
                include: [
                    {
                        model: db.Promotion
                    },
                    {
                        model: db.Product,
                        attributes: ["id", "name", "slug", "brand", "status"]
                    },
                    {
                        model: db.ProductVariant,
                        attributes: ["id", "unitType", "value", "unit", "price", "mrp", "status"]
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
            return items;
        } catch (error) {
            throw error;
        }
    },

    async getPromotionItems(promotionId) {
        try {
            const db = await initializeModels();
            const items = await db.PromotionItem.findAll({
                where: { promotionId },
                include: [
                    {
                        model: db.Product,
                        attributes: ["id", "name", "slug", "brand", "status"]
                    },
                    {
                        model: db.ProductVariant,
                        attributes: ["id", "unitType", "value", "unit", "price", "mrp", "status"]
                    }
                ]
            });
            return items;
        } catch (error) {
            throw error;
        }
    },

    async addPromotionItem(promotionId, productId, variantId) {
        try {
            const db = await initializeModels();
            
            // Check if it already exists
            const existing = await db.PromotionItem.findOne({
                where: { promotionId, productId, variantId: variantId || null }
            });
            if (existing) {
                throw new Error("This product/variant is already in the promotion");
            }

            const item = await db.PromotionItem.create({
                promotionId,
                productId,
                variantId: variantId || null
            });
            
            // Fetch with associations to return complete data
            return await db.PromotionItem.findByPk(item.id, {
                include: [
                    { model: db.Product, attributes: ["id", "name", "slug", "brand", "status"] },
                    { model: db.ProductVariant, attributes: ["id", "unitType", "value", "unit", "price", "mrp", "status"] }
                ]
            });
        } catch (error) {
            throw error;
        }
    },

    async removePromotionItem(id) {
        try {
            const db = await initializeModels();
            const deleted = await db.PromotionItem.destroy({
                where: { id }
            });
            return deleted;
        } catch (error) {
            throw error;
        }
    }
};

export default PromotionItemRepository;
