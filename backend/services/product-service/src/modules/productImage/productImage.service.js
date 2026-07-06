import productImageRepository from "../repository/productImage.repository.js";
import AppError from "../../utils/AppError.js";

class ProductImageService {

    async getImagesByProductId(product_id, { page = 1, limit = 10 } = {}) {
        try {
            if (!product_id) {
                throw new AppError("product_id is required", 400);
            }
            const offset = (page - 1) * limit;
            const { count, rows } = await productImageRepository.getImagesByProductId(product_id, { offset, limit });
            const totalPages = Math.ceil(count / limit);
            const currentPage = Math.floor(offset / limit) + 1;
            return {
                images: rows,
                pagination: {
                    totalItems: count,
                    totalPages,
                    currentPage,
                    limit,
                    hasNextPage: currentPage < totalPages,
                    hasPrevPage: currentPage > 1,
                }
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(error.message, 500);
        }
    }

    async getImagesByVariantId(variant_id, { page = 1, limit = 10 } = {}) {
        try {
            if (!variant_id) {
                throw new AppError("variant_id is required", 400);
            }
            const offset = (page - 1) * limit;
            const { count, rows } = await productImageRepository.getImagesByVariantId(variant_id, { offset, limit });
            const totalPages = Math.ceil(count / limit);
            const currentPage = Math.floor(offset / limit) + 1;
            return {
                images: rows,
                pagination: {
                    totalItems: count,
                    totalPages,
                    currentPage,
                    limit,
                    hasNextPage: currentPage < totalPages,
                    hasPrevPage: currentPage > 1,
                }
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(error.message, 500);
        }
    }

    async getImageById(id) {
        try {
            if (!id) {
                throw new AppError("id is required", 400);
            }
            const image = await productImageRepository.findById(id);
            if (!image) {
                throw new AppError("Product image not found", 404);
            }
            return image;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(error.message, 500);
        }
    }

    async addImage(data) {
        try {
            // If this image is being set as primary, unset all existing primaries first
            if (data.is_primary) {
                await productImageRepository.unsetPrimaryImages(data.product_id);
            }
            const image = await productImageRepository.create(data);
            return image;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(error.message, 500);
        }
    }

    async updateImage(id, updateData) {
        try {
            if (!id) {
                throw new AppError("id is required", 400);
            }
            const existing = await productImageRepository.findById(id);
            if (!existing) {
                throw new AppError("Product image not found", 404);
            }
            // If setting this image as primary, unset others for the same product
            if (updateData.is_primary) {
                await productImageRepository.unsetPrimaryImages(existing.product_id);
            }
            await productImageRepository.updateById(id, updateData);
            return await productImageRepository.findById(id);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(error.message, 500);
        }
    }

    async deleteImage(id) {
        try {
            if (!id) {
                throw new AppError("id is required", 400);
            }
            const existing = await productImageRepository.findById(id);
            if (!existing) {
                throw new AppError("Product image not found", 404);
            }
            return await productImageRepository.deleteById(id);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(error.message, 500);
        }
    }

    async setPrimaryImage(id) {
        try {
            if (!id) {
                throw new AppError("id is required", 400);
            }
            const image = await productImageRepository.findById(id);
            if (!image) {
                throw new AppError("Product image not found", 404);
            }
            // Unset all current primaries for this product
            await productImageRepository.unsetPrimaryImages(image.product_id);
            // Set this image as primary
            await productImageRepository.updateById(id, { is_primary: true });
            return await productImageRepository.findById(id);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(error.message, 500);
        }
    }
}

export default new ProductImageService();
