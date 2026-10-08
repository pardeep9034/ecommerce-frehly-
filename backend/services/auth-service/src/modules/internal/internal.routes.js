import express from "express";
import internalController from "./internal.controller.js";
import requireInternalKey from "../../middleware/internalKey.js";
import { validate } from "../../middleware/validation.js";

const router = express.Router();

router.post("/partners", requireInternalKey, validate("internalPartner"), internalController.findOrCreatePartnerUser);

export default router;
