import express from "express";
import productAttributeController from "../productAttribute/productAttribute.controller.js";
import { superAdminOnly } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
const router=express.Router();

router.get("/",productAttributeController.getAllProductAttributes);
router.post("/",superAdminOnly,validate("createProductAttributeSchema"),productAttributeController.createProductAttributes);
router.get("/:id",productAttributeController.getProductAttributesById);
router.get("/product/:id",productAttributeController.getProductAttributesByProductId);
router.put("/:id",superAdminOnly,validate("updateProductAttributeSchema"),productAttributeController.updateProductAttributes);
router.delete("/:id",superAdminOnly,validate("deleteProductAttributeSchema"),productAttributeController.deleteProductAttributes);
export default router;