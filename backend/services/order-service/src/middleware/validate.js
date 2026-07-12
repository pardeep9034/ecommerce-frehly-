import Joi from "joi";
import ResponseUtil from "../utils/response.js";

const schema = {
  idSchema: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  createOrder: Joi.object({
    user_id: Joi.number().integer().positive().optional(),
    address: Joi.object({
      full_name: Joi.string().max(255).allow(null, "").optional(),
      phone: Joi.string().max(20).allow(null, "").optional(),
      address_line_1: Joi.string().max(255).allow(null, "").optional(),
      address_line_2: Joi.string().max(255).allow(null, "").optional(),
      landmark: Joi.string().max(255).allow(null, "").optional(),
      city: Joi.string().max(100).allow(null, "").optional(),
      state: Joi.string().max(100).allow(null, "").optional(),
      postal_code: Joi.string().max(20).allow(null, "").optional(),
      country: Joi.string().max(100).allow(null, "").optional()
    }).required(),
    items: Joi.array().items(
      Joi.object({
        product_id: Joi.number().integer().positive().optional(),
        variant_id: Joi.number().integer().positive().required(),
        sku: Joi.string().max(100).allow(null, "").optional(),
        product_name: Joi.string().max(255).optional(),
        variant_name: Joi.string().max(255).optional(),
        unit: Joi.string().max(50).allow(null, "").optional(),
        quantity: Joi.number().positive().precision(3).required(),
        mrp: Joi.number().precision(2).optional(),
        selling_price: Joi.number().precision(2).optional()
      })
    ).min(1).required(),
    payment_method: Joi.string()
      .valid("COD", "UPI", "CARD", "NET_BANKING", "WALLET")
      .optional(),
    delivery_fee: Joi.number().min(0).precision(2).default(0),
    discount_amount: Joi.number().min(0).precision(2).default(0)
  }),

  updateOrderStatus: Joi.object({
    status: Joi.string()
      .valid("PLACED", "CONFIRMED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED")
      .required(),
    remarks: Joi.string().allow(null, "").optional(),
    changed_by: Joi.number().integer().positive().optional()
  }),

  cancelOrder: Joi.object({
    reason: Joi.string().min(1).required(),
    cancelled_by: Joi.string().valid("CUSTOMER", "ADMIN").default("CUSTOMER"),
    changed_by: Joi.number().integer().positive().optional()
  }),

  paymentCallback: Joi.object({
    transaction_id: Joi.string().max(255).allow(null, "").optional(),
    gateway_response: Joi.alternatives().try(Joi.object(), Joi.string()).optional(),
    remarks: Joi.string().allow(null, "").optional()
  })
};

const validate = (schemaName) => {
  return (req, res, next) => {
    const validator = schema[schemaName];

    if (!validator) {
      return ResponseUtil.error(res, `Validation schema ${schemaName} not found`, 500);
    }

    const { error, value } = validator.validate(req.body);

    if (error) {
      return ResponseUtil.error(res, error.details[0].message, 400);
    }

    req.body = value;
    return next();
  };
};

export default validate;
