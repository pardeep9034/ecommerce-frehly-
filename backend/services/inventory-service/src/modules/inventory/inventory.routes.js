import express from "express";
import InventoryController from "./inventory.controller.js";

const router = express.Router();

// Define inventory-related routes
router.get("/", InventoryController.getAllInventory);
// ⚠️ Specific routes MUST come before /:id wildcard
router.get("/product/:productId", InventoryController.getInventoryByProductId);
router.get("/variant/:variantId", InventoryController.getInventoryByVariantId);
router.get("/:id", InventoryController.getInventoryById);
router.post("/", InventoryController.createInventory);
router.put("/:id", InventoryController.updateInventory);
router.delete("/:id", InventoryController.deleteInventory);

export default router;
