import express from "express";
import VariantController from "./productVariant.controller.js";
import { superAdminOnly } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";

const router = express.Router({ mergeParams: true });

router.get("/variants/search", VariantController.searchVariants);
router.post("/variants/validate",VariantController.validateVariant)
router.post("/variants/by-ids",VariantController.variantInfo)
router.get("/:productId/variants", VariantController.getAllVariants);
router.get("/variants/:id", VariantController.getVariantById);
router.post("/:productId/variants",superAdminOnly,validate("createVariantSchema"), VariantController.createVariant);
router.put("/variants/:id",superAdminOnly,validate("updateVariantSchema"), VariantController.updateVariant);
router.delete("/variants/:id",superAdminOnly,validate("deleteVariantSchema"), VariantController.deleteVariant);

export default router;
