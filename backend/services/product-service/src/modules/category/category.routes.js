import express from "express";
import CategoryController from "./category.controller.js";


const router = express.Router();

// Define routes for category management
router.post("/", CategoryController.createCategory);
router.get("/", CategoryController.getAllCategories);
router.put("/:id", CategoryController.updateCategory);
router.delete("/:id", CategoryController.deleteCategory);

export default router;
