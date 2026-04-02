import express from "express";
import addToCartController from "./addToCart.controller.js";
const router=express.Router();


router.post("/add",addToCartController);

export default router;