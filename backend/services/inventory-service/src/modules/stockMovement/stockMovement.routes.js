import express from "express";
import StockMovementController from "./stockMovement.controller.js";
import { staffOrService } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";

const router = express.Router();

// Staff reads are limited to the caller's own store (ownStore).
router.get("/", staffOrService, validate("listStockMovementsSchema", "query"), StockMovementController.getAllStockMovements);
router.get("/variant/:variantId", staffOrService, StockMovementController.getStockMovementsByVariantId);
router.get("/:id", staffOrService, StockMovementController.getStockMovementById);
router.post(
  "/",
  staffOrService,
  validate("createStockMovementSchema"),
  StockMovementController.createStockMovement,
);

export default router;
