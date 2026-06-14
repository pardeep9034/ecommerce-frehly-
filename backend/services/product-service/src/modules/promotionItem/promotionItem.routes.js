import express from "express";
import PromotionItemController from "./promotionItem.controller.js";

const router = express.Router();

router.get("/all", PromotionItemController.getAllPromotionItems);
router.get("/:promotionId/items", PromotionItemController.getPromotionItems);
router.post("/:promotionId/items", PromotionItemController.addPromotionItem);
router.delete("/:id", PromotionItemController.removePromotionItem);

export default router;
