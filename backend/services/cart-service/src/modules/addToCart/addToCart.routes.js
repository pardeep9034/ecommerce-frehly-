import express from "express";
import addToCartController from "./addToCart.controller.js";
import authenticate from "../../middleware/authenticate.js";

const router=express.Router();


router.post("/add",authenticate,addToCartController.addToCart);

export default router;