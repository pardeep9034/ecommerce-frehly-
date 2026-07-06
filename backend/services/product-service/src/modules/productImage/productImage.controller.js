import productImageService from "./productImage.service.js";
import ResponseUtil from "../../utils/response.js";

class ProductImageController {

    async getImagesByProductId(req, res, next) {
        try {
            const { productId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await productImageService.getImagesByProductId(productId, { page, limit });
            return ResponseUtil.success(res, result, "Product images fetched successfully", 200);
        } catch (error) {
            next(error);
        }
    }

    async getImagesByVariantId(req, res, next) {
        try {
            const { variantId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await productImageService.getImagesByVariantId(variantId, { page, limit });
            return ResponseUtil.success(res, result, "Variant images fetched successfully", 200);
        } catch (error) {
            next(error);
        }
    }

    async getImageById(req, res, next) {
        try {
            const { id } = req.params;
            const result = await productImageService.getImageById(id);
            return ResponseUtil.success(res, result, "Product image fetched successfully", 200);
        } catch (error) {
            next(error);
        }
    }

    async addImage(req, res, next) {
        try {
            const result = await productImageService.addImage(req.body);
            return ResponseUtil.success(res, result, "Product image added successfully", 201);
        } catch (error) {
            next(error);
        }
    }

    async updateImage(req, res, next) {
        try {
            const { id } = req.params;
            const result = await productImageService.updateImage(id, req.body);
            return ResponseUtil.success(res, result, "Product image updated successfully", 200);
        } catch (error) {
            next(error);
        }
    }

    async deleteImage(req, res, next) {
        try {
            const { id } = req.params;
            const result = await productImageService.deleteImage(id);
            return ResponseUtil.success(res, result, "Product image deleted successfully", 200);
        } catch (error) {
            next(error);
        }
    }

    async setPrimaryImage(req, res, next) {
        try {
            const { id } = req.params;
            const result = await productImageService.setPrimaryImage(id);
            return ResponseUtil.success(res, result, "Primary image set successfully", 200);
        } catch (error) {
            next(error);
        }
    }
}

export default new ProductImageController();
