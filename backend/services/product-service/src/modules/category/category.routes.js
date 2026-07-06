import express from "express";
import CategoryController from "./category.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";


const router = express.Router();

// Define routes for category management
router.post("/",authenticateToken,validate("categorySchema"), CategoryController.createCategory);
router.get("/", CategoryController.getAllCategories);
router.put("/:id",authenticateToken,validate("updateCategorySchema"), CategoryController.updateCategory);
router.delete("/:id",authenticateToken,validate("deleteCategorySchema"), CategoryController.deleteCategory);

export default router;
