import express from "express"
import measurementUnitController from "./measurementUnit.controller.js"
import { authenticateToken } from "../../middleware/auth.js"
import validate from "../../middleware/validate.js"
const router=express.Router()
router.post("/",authenticateToken,validate("createUnitSchema"),measurementUnitController.createUnit)
router.get("/",measurementUnitController.getAllUnits)
router.get("/:id",measurementUnitController.getUnitById)
router.put("/:id",authenticateToken,validate("updateUnitSchema"),measurementUnitController.updateUnit)
router.delete("/:id",authenticateToken,validate("deleteUnitSchema"),measurementUnitController.deleteUnit)
export default router;