import express from "express";
import StockMovementController from "./stockMovement.controller.js";
import { staffOrService } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";

const router = express.Router();

router.get("/", validate("listStockMovementsSchema", "query"), StockMovementController.getAllStockMovements);
router.get("/variant/:variantId", StockMovementController.getStockMovementsByVariantId);
router.get("/:id", StockMovementController.getStockMovementById);
router.post(
  "/",
  staffOrService,
  validate("createStockMovementSchema"),
  StockMovementController.createStockMovement,
);

export default router;
