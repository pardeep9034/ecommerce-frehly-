import express from "express";
import internalController from "./internal.controller.js";
import requireInternalKey from "../../middleware/internalKey.js";
import { validate } from "../../middleware/validation.js";

const router = express.Router();

router.post("/partners", requireInternalKey, validate("internalPartner"), internalController.findOrCreatePartnerUser);
router.post("/users/names", requireInternalKey, validate("internalUserNames"), internalController.getStaffNames);
router.post("/users/contacts", requireInternalKey, validate("internalUserContacts"), internalController.getUserContacts);

export default router;
