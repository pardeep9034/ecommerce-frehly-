import express from "express";
const router = express.Router();
import VarientController from "./varient.controller.js";

router.post("/create", VarientController.createVarient);
router.get("/get-all", VarientController.getAllVarients);
router.get("/get/:id", VarientController.getVarientById);
router.put("/update/:id", VarientController.updateVarient);
router.delete("/delete/:id", VarientController.deleteVarient);

export default router;