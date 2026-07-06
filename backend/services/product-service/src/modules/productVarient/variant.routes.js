import express from "express";
import VariantController from "./variant.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";

const router = express.Router({ mergeParams: true });

router.get("/variants/search", VariantController.searchVariants);
router.get("/:productId/variants", VariantController.getAllVariants);
router.get("/variants/:id", VariantController.getVariantById);
router.post("/:productId/variants",authenticateToken,validate("createVariantSchema"), VariantController.createVariant);
router.put("/variants/:id",authenticateToken,validate("updateVariantSchema"), VariantController.updateVariant);
router.delete("/variants/:id",authenticateToken,validate("deleteVariantSchema"), VariantController.deleteVariant);

export default router;
