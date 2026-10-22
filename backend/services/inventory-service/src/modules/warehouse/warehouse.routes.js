import express from "express";
import WarehouseController from "./warehouse.controller.js";
import { staffOrService } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";

const router = express.Router();

router.get("/", WarehouseController.getAllWarehouses);
router.get("/:id", WarehouseController.getWarehouseById);
router.post(
  "/",
  staffOrService,
  validate("createWarehouseSchema"),
  WarehouseController.createWarehouse,
);
router.put(
  "/:id",
  staffOrService,
  validate("updateWarehouseSchema"),
  WarehouseController.updateWarehouse,
);
router.delete("/:id", staffOrService, WarehouseController.deleteWarehouse);

export default router;
