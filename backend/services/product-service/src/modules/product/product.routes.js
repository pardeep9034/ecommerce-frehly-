import express from "express";
import ProductController from "./product.controller.js";

const router = express.Router();

// Define product-related routes
router.get("/", ProductController.getAllProducts);
router.get("/:id", ProductController.getProductById);
router.post("/", ProductController.createProduct);
router.put("/:id", ProductController.updateProduct);
router.delete("/:id", ProductController.deleteProduct);



export default router;
