import VariantRepository from "../repository/variant.repository.js";

const VariantServices = {
    async getAllVariants(productId) {
        try {
            const variants = await new VariantRepository().getAllVariants(productId);
            return {
                success: true,
                data: variants,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || "Failed to fetch variants",
            };
        }
    },
    
    async getVariantById(id) {
        try {
            const variant = await new VariantRepository().getVariantById(id);
            if (!variant) {
                return { success: false, message: "Variant not found" };
            }
            return {
                success: true,
                data: variant,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || "Failed to fetch variant",
            };
        }
    },

    async createVariant(productId, variantData) {
        const { unitType, value, unit, price, mrp, status } = variantData;

        if (!unitType || price === undefined) {
            return {
                success: false,
                message: "unitType and price are required",
            };
        }

        try {
            const variant = await new VariantRepository().createVariant({
                productId,
                unitType,
                value,
                unit,
                price,
                mrp,
                status,
            });
            return {
                success: true,
                data: variant,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || "Failed to create variant",
            };
        }
    },
    
    async updateVariant(id, variantData) {
        try {
            const updated = await new VariantRepository().updateVariant(id, variantData);
            if (!updated[0]) {
                return { success: false, message: "Variant not found or no changes made" };
            }
            const updatedVariant = await new VariantRepository().getVariantById(id);
            return {
                success: true,
                data: updatedVariant,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || "Failed to update variant",
            };
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
