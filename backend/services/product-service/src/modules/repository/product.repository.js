import { initializeModels } from "../../models/index.js";

class ProductRepository {
    async getAllProducts(limit = 0, offset = 0) {
        const db = await initializeModels();
        return await db.Product.findAndCountAll({
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            include: [{ model: db.Category, as: "Category", attributes: ["id", "name"] }],
        });
    }

    async createProduct(productData) {
        if (productData) {
            const db = await initializeModels();
            return await db.Product.create(productData);
        }
        return null;
    }

    async getProductById(id) {
        const db = await initializeModels();
        return await db.Product.findByPk(id, {
            include: [
                { model: db.Category, as: "Category", attributes: ["id", "name"] },
                { model: db.ProductVariant, as: "variants" }
            ],
        });
    }

    async updateProduct(id, productData) {
        const db = await initializeModels();
        return await db.Product.update(productData, { where: { id } });
    }

    async deleteProduct(id) {
        const db = await initializeModels();
        return await db.Product.destroy({ where: { id } });
    }
}

export default ProductRepository;

