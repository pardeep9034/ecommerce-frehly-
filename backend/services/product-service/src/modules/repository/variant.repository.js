import { initializeModels } from "../../models/index.js";

class VariantRepository {
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
        return await db.ProductVariant.findByPk(id);
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
