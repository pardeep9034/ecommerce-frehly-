import { initializeModels } from "../../models/index.js";

class ProductRepository {
  async getProductsByType(type, limit, offset) {

    const db = await initializeModels();

    const result = await db.PromotionItem.findAndCountAll({

        limit,
        offset,

        include: [
            {
                model: db.Promotion,
                where: { type },   // ✅ filter here
                attributes: ["id", "title", "type"]
            },
            {
                model: db.Product,
                as: "Product",
                attributes: ["id", "name", "slug"],
                include: [
                    {
                        model: db.ProductVariant,
                        as: "variants",
                        attributes: ["id", "unitType", "value", "unit", "price", "mrp", "status"]
                    }
                ]
            }
        ],

        order: [["createdAt", "DESC"]]
    });

    // Filter variants based on PromotionItem.variantId
    result.rows = result.rows.map(item => {
        const itemJson = item.get({ plain: true });
        if (itemJson.variantId && itemJson.Product && itemJson.Product.variants) {
            itemJson.Product.variants = itemJson.Product.variants.filter(v => v.id === itemJson.variantId);
        }
        return itemJson;
    });

    return result;
}
    async getAllProducts(limit = 0, offset = 0) {
        const db = await initializeModels();
        return await db.Product.findAndCountAll({
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            include: [
                { model: db.Category, as: "Category", attributes: ["id", "name"] },
                { model: db.ProductVariant, as: "variants", attributes: ["id", "unitType","value","unit","price","mrp","status"] }
            ],
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

