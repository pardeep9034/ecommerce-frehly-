import express from "express";
import productAttributeController from "../productAttribute/productAttribute.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
const router=express.Router();

router.get("/",productAttributeController.getAllProductAttributes);
router.post("/",authenticateToken,validate("createProductAttributeSchema"),productAttributeController.createProductAttributes);
router.get("/:id",productAttributeController.getProductAttributesById);
router.get("/product/:id",productAttributeController.getProductAttributesByProductId);
router.put("/:id",authenticateToken,validate("updateProductAttributeSchema"),productAttributeController.updateProductAttributes);
router.delete("/:id",authenticateToken,validate("deleteProductAttributeSchema"),productAttributeController.deleteProductAttributes);
export default router;