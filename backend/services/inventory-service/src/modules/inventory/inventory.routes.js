import express from "express";
import InventoryController from "./inventory.controller.js";
import { staffOrService } from "../../middleware/auth.js";
import {validate} from "../../middleware/validate.js";
import inventoryController from "./inventory.controller.js";
const router = express.Router();

// Define inventory-related routes
router.get("/", InventoryController.getAllInventory);
// ⚠️ Specific routes MUST come before /:id wildcard
router.get("/summary", staffOrService, validate("stockSummarySchema", "query"), InventoryController.getStockSummary);
router.get("/variant/:variantId", InventoryController.getInventoryByVariantId);
// Get inventory filtered by warehouse id (paginated)
router.get("/warehouse/:warehouseId", InventoryController.getInventoryByWarehouseId);
router.post("/validate",inventoryController.inventoryValidate)
router.post("/in-stock-variants",inventoryController.getInStockVariantIds)
router.get("/:id", InventoryController.getInventoryById);
router.post("/",staffOrService,validate("createInventorySchema"),InventoryController.createInventory);
router.put("/:id",staffOrService,validate("updateInventorySchema"),InventoryController.updateInventory);
router.delete("/:id",staffOrService,validate("deleteInventorySchema"),InventoryController.deleteInventory);

export default router;
