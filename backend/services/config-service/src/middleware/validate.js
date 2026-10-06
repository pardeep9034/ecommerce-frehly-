import Joi from "joi";
import ResponseUtil from "../utils/response.js";
import AppError from "../utils/AppError.js";

const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const minutes = (fallback) => Joi.number().integer().min(1).max(1440).default(fallback);

// One schema per settings group. The .default() values are the app defaults:
// the service fills them in on read, the PATCH validation skips them.
export const schemas = {
  general: Joi.object({
    businessName: Joi.string().trim().min(1).max(100).default("Freshly"),
    supportPhone: Joi.string().trim().max(20).allow("").default(""),
    supportEmail: Joi.string().trim().email().allow("").default(""),
    gstin: Joi.string().trim().uppercase().pattern(GSTIN).allow("").default(""),
    cod: Joi.boolean().default(true),
    showOutOfStock: Joi.boolean().default(true),
    slotLength: Joi.number().integer().min(1).max(24).default(2)
  }),

  orderRules: Joi.object({
    paymentWindow: minutes(15),
    replyWindow: minutes(15),
    riderAcceptWindow: minutes(5),
    cancelWhilePicking: Joi.boolean().default(true),
    cancelWhilePacking: Joi.boolean().default(false),
    autoRefundMissing: Joi.boolean().default(true)
  })
};

// Validates a partial update for the group named in the URL (:group).
const validateGroup = (req, res, next) => {
  const schema = schemas[req.params.group];

  if (!schema) {
    return next(new AppError(`Unknown settings group: ${req.params.group}`, 404));
  }

  const { error, value } = schema.min(1).required().validate(req.body, { abortEarly: false, noDefaults: true });

  if (error) {
    return ResponseUtil.validationError(
      res,
      error.details.map((d) => ({ field: d.path.join("."), message: d.message }))
    );
  }

  req.body = value;
  return next();
};

export default validateGroup;
