
import AppError from "../../utils/AppError.js";
import { generateSku } from "../../utils/helper.js";
import variantRepository from "../repository/variant.repository.js";
import productRepository from "../repository/product.repository.js";
import logger from "../../utils/Logger.js";
const VariantServices = {
    async searchVariantsByProductName(search) {
        try {
            if (!search || search.trim() === "") {
               throw new AppError("Search query is required",400)
            }
            const products = await productRepository.searchVariantsByProductName(search.trim());
            return products;
        } catch (error) {
           if (error instanceof AppError) throw error;
           throw new AppError("Failed to search variants",400)
        }
    },
   async variantInfo(variantIds) {
    if (!Array.isArray(variantIds) || variantIds.length === 0) {
        throw new AppError(
            "variantIds must be a non-empty array",
            400
        );
    }

    try {
        const variants = await variantRepository.findAll(
            {
                id: variantIds,
            },
            {
                include: [
                    {
                        association: "product",
                    },
                    {
                        association: "measurementUnit",
                    },
                    {
                        association:"images"
                    }
                ],
            }
        );

        const modifiedVariants = variants.map((variant) => {
            const data = variant.toJSON();

            return {
                id: data.id,
        product_id: data.product_id,
        product_name: data.product?.name ?? null,
        variant_name: `${data.quantity} ${data.measurementUnit?.name ?? ""}`,
        price: data.price,
        mrp: data.mrp,
        image: data.images.image_url??null,
            };
        });

        return modifiedVariants;

    } catch (error) {
        throw new AppError(
            `Failed to fetch variant information: ${error.message}`,
            500
        );
    }
},
    async validateVariant(variantIds){
        logger.debug("validateVariant variant ids", { variantIds });
        try{
            const variants = await variantRepository.findAll({id:variantIds,status:"ACTIVE"}) 
            return variants;

        }catch(error){
            throw new AppError("failed to validate the variants");
        }

    },

    async getAllVariants(productId,offset,limit) {
        try {
            if(!productId){
                throw new AppError("id is required",400);
            }
            const {count,rows} = await variantRepository.getAllVariants(productId,offset,limit);
            const totalPages = Math.ceil(count / limit);
          const currentPage = Math.floor(offset / limit) + 1;
           return{
            variants:rows,
             pagination: {
          totalItems: count,
          totalPages,
          currentPage,
          limit,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        },
           }
           
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError("variants not found",404)
        }
    },

    async getVariantById(id) {
        try {
            if(!id){
                throw new AppError("id is required",400);
            }
            const variant = await variantRepository.getVariantById(id);
            if (!variant) {
                throw new AppError("variant not found",404);
            }
          return variant;
        } catch (error) {
           if (error instanceof AppError) throw error;
           throw new AppError(error.message || "Failed to fetch variant",400);
        }
    },

    async createVariant(productId, variantData) {
        try{
            if(!productId){
                throw new AppError("Product id is required",400)
            }
            variantData.product_id = Number(productId);
            const sku = await generateSku();
            const existing = await variantRepository.findExistingVariant(sku, variantData.barcode);
            if(existing){
                throw new AppError("Variant with this SKU or barcode already exists",400)
            }
            variantData.sku = sku;
            if(variantData.price > variantData.mrp){
                throw new AppError("Price should be less than or equal to MRP",400);
            }
            const variant = await variantRepository.createVariant(variantData);
            return variant;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(error.message || "Failed to create variant", 400);
        }
    },
    
    async updateVariant(id, variantData) {
        try {
            if(!id){
                throw new AppError(" variant id is required",400);
            }
            const existingVariant=await variantRepository.findById(id);
            if(!existingVariant){
                throw new AppError("Variant not found",404);
            }
            const updated = await variantRepository.updateVariant(id, variantData);
            return updated;
        } catch (error) {
           if (error instanceof AppError) throw error;
           throw new AppError(error.message,400);
        }
    },

    async deleteVariant(id) {
        try {
            const deleted = await variantRepository.deleteVariant(id);
            if (!deleted) {
                throw new AppError("Variant not found", 404);
            }
            return {
                success: true,
                message: "Variant deleted successfully",
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(error.message || "Failed to delete variant", 500);
        }
    }
};

export default VariantServices;
