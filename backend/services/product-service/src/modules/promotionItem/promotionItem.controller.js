import ResponseUtil from "../../utils/response.js";
import PromotionItemServices from "./promotionItem.services.js";

const PromotionItemController = {
    async getAllPromotionItems(req, res) {
        try {
            const result = await PromotionItemServices.getAllPromotionItems();
            if (result.success) {
                return ResponseUtil.success(res, result.data);
            }
            return ResponseUtil.error(res, result.message);
        } catch (error) {
            return ResponseUtil.error(res, error);
        }
    },

    async getPromotionItems(req, res) {
        try {
            const { promotionId } = req.params;
            const result = await PromotionItemServices.getPromotionItems(promotionId);
            if (result.success) {
                return ResponseUtil.success(res, result.data);
            }
            return ResponseUtil.error(res, result.message);
        } catch (error) {
            return ResponseUtil.error(res, error);
        }
    },

    async addPromotionItem(req, res) {
        try {
            const { promotionId } = req.params;
            const { productId, variantId } = req.body;
            const result = await PromotionItemServices.addPromotionItem(promotionId, productId, variantId);
            if (result.success) {
                return ResponseUtil.success(res, result.data, 201);
            }
            return ResponseUtil.error(res, result.message);
        } catch (error) {
            return ResponseUtil.error(res, error);
        }
    },

    async removePromotionItem(req, res) {
        try {
            const { id } = req.params;
            const result = await PromotionItemServices.removePromotionItem(id);
            if (result.success) {
                return ResponseUtil.success(res, result.data);
            }
            return ResponseUtil.error(res, result.message);
        } catch (error) {
            return ResponseUtil.error(res, error);
        }
    }
};

export default PromotionItemController;
