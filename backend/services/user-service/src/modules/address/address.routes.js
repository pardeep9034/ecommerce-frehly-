import express from "express";
import AddressController from "./address.controller.js";

const router = express.Router();

router.get("/", AddressController.getAllAddresses);
router.get("/:id", AddressController.getAddressById);
router.get("/user/:userId", AddressController.getAddressesByUserId);
router.post("/", AddressController.createAddress);
router.put("/:id", AddressController.updateAddress);
router.put("/:id/set-default", AddressController.setDefaultAddress);
router.delete("/:id", AddressController.deleteAddress);

export default router;
