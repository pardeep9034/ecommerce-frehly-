import express from "express";
import StockMovementController from "./stockMovement.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";

const router = express.Router();

router.get("/", StockMovementController.getAllStockMovements);
router.get("/variant/:variantId", StockMovementController.getStockMovementsByVariantId);
router.get("/:id", StockMovementController.getStockMovementById);
router.post(
  "/",
  authenticateToken,
  validate("createStockMovementSchema"),
  StockMovementController.createStockMovement,
);

export default router;
