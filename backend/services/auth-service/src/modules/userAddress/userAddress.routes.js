import express from "express";
import UserAddressController from "./userAddress.controller.js";
import validateAddress from "./userAddress.validation.js";
import { authenticateToken } from "../../middleware/auth.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = express.Router();

router.use(authenticateToken);

router.post("/", validateAddress("createAddress"), asyncHandler(UserAddressController.createAddress));
router.get("/", asyncHandler(UserAddressController.getUserAddresses));
router.get("/:id", asyncHandler(UserAddressController.getAddressById));
router.put("/:id", validateAddress("updateAddress"), asyncHandler(UserAddressController.updateAddress));
router.delete("/:id", asyncHandler(UserAddressController.deleteAddress));

export default router;
