import express from "express";
import productImageController from "./productImage.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";

const router = express.Router();

/* ---- GET ---- */
// Get all images for a product
router.get("/product/:productId", productImageController.getImagesByProductId);

// Get all images for a variant
router.get("/variant/:variantId", productImageController.getImagesByVariantId);

// Get a single image by ID
router.get("/:id", productImageController.getImageById);

/* ---- POST ---- */
// Add a new image to a product
router.post("/", authenticateToken, validate("addProductImageSchema"), productImageController.addImage);

/* ---- PATCH ---- */
// Set an image as primary
router.patch("/:id/set-primary", authenticateToken, productImageController.setPrimaryImage);

/* ---- PUT ---- */
// Update image metadata
router.put("/:id", authenticateToken, validate("updateProductImageSchema"), productImageController.updateImage);

/* ---- DELETE ---- */
// Delete an image
router.delete("/:id", authenticateToken, validate("deleteProductImageSchema"), productImageController.deleteImage);

export default router;
