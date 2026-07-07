import express from "express";
import InventoryController from "./inventory.controller.js";
import {authenticateToken} from "../../middleware/auth.js";
import {validate} from "../../middleware/validate.js";
const router = express.Router();

// Define inventory-related routes
router.get("/", InventoryController.getAllInventory);
// ⚠️ Specific routes MUST come before /:id wildcard

router.get("/variant/:variantId", InventoryController.getInventoryByVariantId);
router.get("/:id", InventoryController.getInventoryById);
router.post("/",authenticateToken,validate("createInventorySchema"),InventoryController.createInventory);
router.put("/:id",authenticateToken,validate("updateInventorySchema"),InventoryController.updateInventory);
router.delete("/:id",authenticateToken,validate("deleteInventorySchema"),InventoryController.deleteInventory);

export default router;
