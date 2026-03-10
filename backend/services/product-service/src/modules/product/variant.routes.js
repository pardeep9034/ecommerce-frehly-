import express from "express";
import VariantController from "./variant.controller.js";

const router = express.Router({ mergeParams: true });

// Define variant-related routes
// We typically nest these under /products/:productId/variants or mount them directly
router.get("/:productId/variants", VariantController.getAllVariants);
router.get("/variants/:id", VariantController.getVariantById);
router.post("/:productId/variants", VariantController.createVariant);
router.put("/variants/:id", VariantController.updateVariant);
router.delete("/variants/:id", VariantController.deleteVariant);

export default router;
