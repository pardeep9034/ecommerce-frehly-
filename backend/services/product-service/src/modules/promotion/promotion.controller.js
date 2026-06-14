import ResponseUtil from "../../utils/response.js";
import PromotionServices from "./promotion.services.js";

const PromotionController = {
    async getAllPromotions(req, res) {
        try {
            const result = await PromotionServices.getAllPromotions();
            if (result.success) {
                return ResponseUtil.success(res, result.data);
            }
            return ResponseUtil.error(res, result.message);
        } catch (error) {
            return ResponseUtil.error(res, error);
        }
    },
    async getPromotionById(req, res) {
        try {
            const result = await PromotionServices.getPromotionById(req.params.id);
            if (result.success) {
                return ResponseUtil.success(res, result.data);
            }
            return ResponseUtil.error(res, result.message);
        } catch (error) {
            return ResponseUtil.error(res, error);
        }
    },
    async createPromotion(req, res) {
        try {
            const result = await PromotionServices.createPromotion(req.body);
            if (result.success) {
                return ResponseUtil.success(res, result.data);
            }
            return ResponseUtil.error(res, result.message);
        } catch (error) {
            return ResponseUtil.error(res, error);
        }
    },
    async updatePromotion(req, res) {
        try {
            const result = await PromotionServices.updatePromotion(req.params.id, req.body);
            if (result.success) {
                return ResponseUtil.success(res, result.data);
            }
            return ResponseUtil.error(res, result.message);
        } catch (error) {
            return ResponseUtil.error(res, error);
        }
    },
    async deletePromotion(req, res) {
        try {
            const result = await PromotionServices.deletePromotion(req.params.id);
            if (result.success) {
                return ResponseUtil.success(res, result.data);
            }
            return ResponseUtil.error(res, result.message);
        } catch (error) {
            return ResponseUtil.error(res, error);
        }
    }
};

export default PromotionController;