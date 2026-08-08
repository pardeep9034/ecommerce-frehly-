import VariantRepository from "../repository/variant.repository.js";
import AppError from "../../utils/AppError.js";
import { generateSku } from "../../utils/helper.js";
import variantRepository from "../repository/variant.repository.js";
const VariantServices = {
    async searchVariantsByProductName(search) {
        try {
            if (!search || search.trim() === "") {
               throw new AppError("Search query is required",400)
            }
            const products = await VariantRepository.searchVariantsByProductName(search.trim());
            return products;
        } catch (error) {
           throw new AppError("Failed to search variants",400)
        }
    },
    async validateVariant(variantIds){
        console.log("variants ids",variantIds)
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
            const {count,rows} = await VariantRepository.getAllVariants(productId,offset,limit);
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
            throw new AppError("variants not found",404)
        }
    },
    
    async getVariantById(id) {
        try {
            if(!id){
                throw new AppError("id is required",400);
            }
            const variant = await VariantRepository.getVariantById(id);
            if (!variant) {
                throw new AppError("variant not found",404);
            }
          return variant;
        } catch (error) {
           throw new AppError(error.message || "Failed to fetch variant",400);
        }
    },

    async createVariant(productId, variantData) {
        try{
            if(!productId){
                throw new AppError("Product id is required",400)
            }
            variantData.product_id = Number(productId);
            const sku = variantData.sku || generateSku();
            const existing = await VariantRepository.findExistingVariant(sku, variantData.barcode);
            if(existing){
                throw new AppError("Variant with this SKU or barcode already exists",400)
            }
            variantData.sku = sku;
            if(variantData.price > variantData.mrp){
                throw new AppError("Price should be less than or equal to MRP",400);
            }
            const variant = await VariantRepository.createVariant(variantData);
            return variant;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(error.message || "Failed to create variant", 400);
        }
    },
    
    async updateVariant(id, variantData) {
        try {
            if(!id){
                throw new AppError("id is required",400);
            }
            const existingVariant=await variantRepository.findById(id);
            if(!existingVariant){
                throw new AppError("Variant not found",404);
            }
            const updated = await VariantRepository.updateVariant(id, variantData);
            return updated;
        } catch (error) {
           throw new AppError(error.message,400);
        }
    },

    async deleteVariant(id) {
        try {
            const deleted = await new VariantRepository().deleteVariant(id);
            if (!deleted) {
                return { success: false, message: "Variant not found" };
            }
            return {
                success: true,
                message: "Variant deleted successfully",
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || "Failed to delete variant",
            };
        }
    }
};

export default VariantServices;
