import { initializeModels } from "../../models/index.js";
import { Op } from "sequelize";

class VariantRepository {
    async searchVariantsByProductName(search) {
        const db = await initializeModels();
        return await db.Product.findAll({
            where: {
                name: { [Op.like]: `%${search}%` }
            },
            include: [
                { model: db.ProductVariant, as: "variants" },
                { model: db.Category, as: "Category", attributes: ["id", "name"] }
            ],
            order: [["createdAt", "DESC"]],
        });
    }

    async getAllVariants(productId) {
        const db = await initializeModels();
        return await db.ProductVariant.findAll({
            where: { productId },
            order: [["createdAt", "DESC"]],
        });
    }

    async createVariant(variantData) {
        const db = await initializeModels();
        return await db.ProductVariant.create(variantData);
    }

    async getVariantById(id) {
        const db = await initializeModels();
        return await db.ProductVariant.findByPk(id, {
            include: [{ model: db.Product, attributes: ["name", "slug", "brand"] }]
        });
    }

    async updateVariant(id, variantData) {
        const db = await initializeModels();
        return await db.ProductVariant.update(variantData, { where: { id } });
    }

    async deleteVariant(id) {
        const db = await initializeModels();
        return await db.ProductVariant.destroy({ where: { id } });
    }
}

export default VariantRepository;
