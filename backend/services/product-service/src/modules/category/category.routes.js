import express from "express";
import CategoryController from "./category.controller.js";
import { superAdminOnly } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import categoryController from "./category.controller.js";


const router = express.Router();

// Define routes for category management
router.post("/",superAdminOnly,validate("categorySchema"), CategoryController.createCategory);
router.get("/", CategoryController.getAllCategories);
router.get("/selection", CategoryController.getCategorySelection);
router.put("/:id",superAdminOnly,validate("updateCategorySchema"), CategoryController.updateCategory);
router.delete("/:id",superAdminOnly,validate("deleteCategorySchema"), CategoryController.deleteCategory);

export default router;
