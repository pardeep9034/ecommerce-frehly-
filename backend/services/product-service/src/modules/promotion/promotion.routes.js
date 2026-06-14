import express from "express";
import PromotionController from "./promotion.controller.js";

const router = express.Router();

router.get("/", PromotionController.getAllPromotions);
router.get("/:id", PromotionController.getPromotionById);
router.post("/", PromotionController.createPromotion);
router.put("/:id", PromotionController.updatePromotion);
router.delete("/:id", PromotionController.deletePromotion);

export default router;