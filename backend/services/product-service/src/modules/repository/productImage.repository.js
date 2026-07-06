import BaseRepository from "./baseRepository.js";

class ProductImageRepository extends BaseRepository {
    constructor() {
        super("ProductImage");
    }

    async getImagesByProductId(product_id, { offset = 0, limit = 10 } = {}) {
        return await this.findAndCountAll(
            { product_id },
            { offset, limit, order: [["sort_order", "ASC"], ["created_at", "DESC"]] }
        );
    }

    async getImagesByVariantId(variant_id, { offset = 0, limit = 10 } = {}) {
        return await this.findAndCountAll(
            { variant_id },
            { offset, limit, order: [["sort_order", "ASC"], ["created_at", "DESC"]] }
        );
    }

    async getPrimaryImage(product_id) {
        return await this.findOne({ product_id, is_primary: true });
    }

    async unsetPrimaryImages(product_id) {
        const Model = await this.getModel();
        return await Model.update(
            { is_primary: false },
            { where: { product_id, is_primary: true } }
        );
    }
}

export default new ProductImageRepository();
