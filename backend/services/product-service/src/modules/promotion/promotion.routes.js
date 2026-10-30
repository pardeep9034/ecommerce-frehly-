import express from "express";
import PromotionController from "./promotion.controller.js";
import { superAdminOnly } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", PromotionController.getAllPromotions);
router.get("/:id", PromotionController.getPromotionById);
router.post("/", superAdminOnly, PromotionController.createPromotion);
router.put("/:id", superAdminOnly, PromotionController.updatePromotion);
router.delete("/:id", superAdminOnly, PromotionController.deletePromotion);

export default router;