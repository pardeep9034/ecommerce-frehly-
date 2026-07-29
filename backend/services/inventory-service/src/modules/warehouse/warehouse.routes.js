import express from "express";
import WarehouseController from "./warehouse.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";

const router = express.Router();

router.get("/", WarehouseController.getAllWarehouses);
router.get("/:id", WarehouseController.getWarehouseById);
router.post(
  "/",
  authenticateToken,
  validate("createWarehouseSchema"),
  WarehouseController.createWarehouse,
);
router.put(
  "/:id",
  authenticateToken,
  validate("updateWarehouseSchema"),
  WarehouseController.updateWarehouse,
);
router.delete("/:id", authenticateToken, WarehouseController.deleteWarehouse);

export default router;
