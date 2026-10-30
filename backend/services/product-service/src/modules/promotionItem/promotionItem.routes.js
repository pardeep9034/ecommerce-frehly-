import express from "express";
import PromotionItemController from "./promotionItem.controller.js";
import { superAdminOnly } from "../../middleware/auth.js";

const router = express.Router();

router.get("/all", PromotionItemController.getAllPromotionItems);
router.get("/:promotionId/items", PromotionItemController.getPromotionItems);
router.post("/:promotionId/items", superAdminOnly, PromotionItemController.addPromotionItem);
router.delete("/:id", superAdminOnly, PromotionItemController.removePromotionItem);

export default router;
