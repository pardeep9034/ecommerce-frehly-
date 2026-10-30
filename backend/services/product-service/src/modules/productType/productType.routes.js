import express from 'express';
import ProductTypeController from './productType.controller.js'
import { superAdminOnly } from '../../middleware/auth.js';
import validate from '../../middleware/validate.js';

const router = express.Router();

router.post("/",superAdminOnly,validate("createProductTypeSchema"), ProductTypeController.createProductType);
router.get("/", ProductTypeController.getAllProductTypes);
router.put("/:id",superAdminOnly,validate("updateProductTypeSchema"), ProductTypeController.updateProductType);
router.get("/:id", ProductTypeController.getProductTypeById);
router.delete("/:id",superAdminOnly,validate("deleteProductTypeSchema"), ProductTypeController.deleteProductType);


export default router;
