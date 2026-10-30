import express from "express"
import BrandController from "./brand.controller.js"
import { superAdminOnly } from "../../middleware/auth.js"
import validate from "../../middleware/validate.js";

const router = express.Router();

router.post("/", superAdminOnly,validate("createBrandSchema"), BrandController.createBrand);
router.get("/", BrandController.getAllBrands);
router.put("/:id", superAdminOnly,validate("updateBrandSchema"), BrandController.updateBrand);
router.get("/:id", BrandController.getBrandById);
router.delete("/:id", superAdminOnly,validate("deleteBrandSchema"), BrandController.deleteBrand);


export default router;
