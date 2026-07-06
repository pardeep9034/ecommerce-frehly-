import express from "express"
import BrandController from "./brand.controller.js"
import { authenticateToken } from "../../middleware/auth.js"
import validate from "../../middleware/validate.js";

const router = express.Router();

router.post("/", authenticateToken,validate("createBrandSchema"), BrandController.createBrand);
router.get("/", BrandController.getAllBrands);
router.put("/:id", authenticateToken,validate("updateBrandSchema"), BrandController.updateBrand);
router.get("/:id", BrandController.getBrandById);
router.delete("/:id", authenticateToken,validate("deleteBrandSchema"), BrandController.deleteBrand);


export default router;
