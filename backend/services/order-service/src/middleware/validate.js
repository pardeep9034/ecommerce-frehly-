import Joi from "joi";
import ResponseUtil from "../utils/response.js";

const schema = {
  idSchema: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  createOrder: Joi.object({
  
    address_id: Joi.number().required(),
    cart_id:Joi.number().required(),
    payment_method: Joi.string()
      .valid("COD", "UPI", "CARD", "NET_BANKING", "WALLET")
      .optional(),
    delivery_fee: Joi.number().min(0).precision(2).default(0),
    discount_amount: Joi.number().min(0).precision(2).default(0),
    warehouse_id:Joi.number()
  }),

  updateOrderStatus: Joi.object({
    status: Joi.string()
      .valid("PLACED", "CONFIRMED","READY_FOR_ASSIGNMENT","ASSIGNED","PICKED_UP", "OUT_FOR_DELIVERY","HANDOVER_IN_PROGRESS", "DELIVERED", "CANCELLED","DELIVERY_FAILED","PENDING_PAYMENT","PAYMENT_FAILED","PAYMENT_EXPIRED")
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
