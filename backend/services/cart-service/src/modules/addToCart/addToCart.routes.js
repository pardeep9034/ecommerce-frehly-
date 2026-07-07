import express from "express";
import addToCartController from "./addToCart.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import validate from "../../middleware/validation.js";

const router=express.Router();


router.post("/add",authenticateToken,validate("addToCart"),addToCartController.addToCart);
router.get("/:cartId", authenticateToken, addToCartController.getCart);
router.delete("/item/:cartItemId", authenticateToken, addToCartController.removeCartItem);

export default router;