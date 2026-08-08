import express from 'express';
import ProductTypeController from './productType.controller.js'
import { authenticateToken } from '../../middleware/auth.js';
import validate from '../../middleware/validate.js';

const router = express.Router();

router.post("/",authenticateToken,validate("createProductTypeSchema"), ProductTypeController.createProductType);
router.get("/", ProductTypeController.getAllProductTypes);
router.put("/:id",authenticateToken,validate("updateProductTypeSchema"), ProductTypeController.updateProductType);
router.get("/:id", ProductTypeController.getProductTypeById);
router.delete("/:id",authenticateToken,validate("deleteProductTypeSchema"), ProductTypeController.deleteProductType);


export default router;
