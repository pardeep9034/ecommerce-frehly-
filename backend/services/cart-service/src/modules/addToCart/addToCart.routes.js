import express from "express";
import addToCartController from "./addToCart.controller.js";
import { authenticateToken } from "../../../../auth-service/src/middleware/auth.js";
const router=express.Router();


router.post("/add",addToCartController.addToCart);

export default router;