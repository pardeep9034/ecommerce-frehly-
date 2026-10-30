import express from "express";
import InventoryController from "./inventory.controller.js";
import { staffOrService } from "../../middleware/auth.js";
import {validate} from "../../middleware/validate.js";
import inventoryController from "./inventory.controller.js";
const router = express.Router();

// Define inventory-related routes. Staff reads are limited to the caller's own store (ownStore); /variant/:variantId
// stays open for cart-service, which calls it without a token.
router.get("/", staffOrService, InventoryController.getAllInventory);
// ⚠️ Specific routes MUST come before /:id wildcard
router.get("/summary", staffOrService, validate("stockSummarySchema", "query"), InventoryController.getStockSummary);
router.get("/variant/:variantId", InventoryController.getInventoryByVariantId);
// Get inventory filtered by warehouse id (paginated)
router.get("/warehouse/:warehouseId", staffOrService, InventoryController.getInventoryByWarehouseId);
router.post("/validate",inventoryController.inventoryValidate)
router.post("/in-stock-variants",inventoryController.getInStockVariantIds)
// The shop: which of these variants the customer's store (x-warehouse-id) carries, and how many are available.
router.post("/store-stock", validate("storeStockSchema"), inventoryController.getStoreStock)
router.get("/:id", staffOrService, InventoryController.getInventoryById);
router.post("/",staffOrService,validate("createInventorySchema"),InventoryController.createInventory);
router.put("/:id",staffOrService,validate("updateInventorySchema"),InventoryController.updateInventory);
// the id is in the URL; the client sends no body
router.delete("/:id",staffOrService,validate("deleteInventorySchema","params"),InventoryController.deleteInventory);

export default router;
