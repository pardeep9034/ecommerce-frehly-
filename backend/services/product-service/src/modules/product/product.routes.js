import express from "express";
import ProductController from "./product.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";

const router = express.Router();

// Define product-related routes
router.get("/", ProductController.getAllProducts);
router.get("/category",ProductController.getProductsBycategory)
router.get("/:id", ProductController.getProductById);
//check product and varient id exist or not
// router.get("/check/:productId/:varientId", ProductController.checkProductAndVarientExists);
router.post("/",authenticateToken,validate("createProductSchema"), ProductController.createProduct);
router.put("/:id",authenticateToken,validate("updateProductSchema"), ProductController.updateProduct);
router.delete("/:id",authenticateToken,validate("deleteProductSchema"), ProductController.deleteProduct);



export default router;
