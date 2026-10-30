import express from "express"
import measurementUnitController from "./measurementUnit.controller.js"
import { superAdminOnly } from "../../middleware/auth.js"
import validate from "../../middleware/validate.js"
const router=express.Router()
router.post("/",superAdminOnly,validate("createUnitSchema"),measurementUnitController.createUnit)
router.get("/",measurementUnitController.getAllUnits)
router.get("/:id",measurementUnitController.getUnitById)
router.put("/:id",superAdminOnly,validate("updateUnitSchema"),measurementUnitController.updateUnit)
router.delete("/:id",superAdminOnly,validate("deleteUnitSchema"),measurementUnitController.deleteUnit)
export default router;