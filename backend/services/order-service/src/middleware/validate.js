import Joi from "joi";
import ResponseUtil from "../utils/response.js";

// Why the customer turned an item away at the door. ponytail: delivery-service's DOOR_REJECT_REASONS says the same;
// change both together.
const DOOR_REJECT_REASONS = ["NOT_WANTED", "WRONG_ITEM", "DAMAGED", "BAD_QUALITY", "OTHER"];
// After delivery (the client's lib/assignmentStatus.js lists the same). Photo needed for the first three (order.service).
const CUSTOMER_RETURN_REASONS = ["DAMAGED", "BAD_QUALITY", "WRONG_ITEM", "MISSING", "OTHER"];
// Why the store turned a customer's return down. Staff only; the customer sees "doesn't meet our return terms".
const RETURN_REJECT_REASONS = ["OUTSIDE_WINDOW", "NO_PROOF", "NOT_AS_REPORTED", "QUANTITY", "OTHER"];

const rejectedItems = Joi.array().items(Joi.object({
  order_item_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).required(),
  reason: Joi.string().valid(...DOOR_REJECT_REASONS).required(),
  note: Joi.string().trim().max(500).allow(null, "").optional()
})).default([]);

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
      .valid("PLACED", "CONFIRMED","READY_FOR_ASSIGNMENT","ASSIGNED","PICKED_UP", "OUT_FOR_DELIVERY","HANDOVER_IN_PROGRESS", "DELIVERED", "CANCELLED","DELIVERY_FAILED","PAYMENT_FAILED","PAYMENT_EXPIRED")
      .required(),
    remarks: Joi.string().allow(null, "").optional(),
    changed_by: Joi.number().integer().positive().optional()
  }),

  cancelOrder: Joi.object({
    reason: Joi.string().min(1).required(),
    cancelled_by: Joi.string().valid("CUSTOMER", "ADMIN").default("CUSTOMER"),
    changed_by: Joi.number().integer().positive().optional(),
    // Only for an order back at the store (RETURNED_TO_STORE): what goes back on the shelf. Left out = all of it.
    items: Joi.array().items(Joi.object({
      order_item_id: Joi.number().integer().positive().required(),
      restock_qty: Joi.number().integer().min(0).required(),
      write_off_qty: Joi.number().integer().min(0).required()
    })).optional()
  }),

  // The rider's "Delivered" (delivery-service, SYSTEM) and the door QR: what was turned away at the door.
  deliverAtDoor: Joi.object({
    assignment_id: Joi.string().guid().optional(),
    rejected_items: rejectedItems,
    payment_method: Joi.string().valid("CASH", "UPI").optional(),
    changed_by: Joi.number().integer().positive().optional()
  }),

  doorQr: Joi.object({
    rejected_items: rejectedItems
  }),

  returnArrived: Joi.object({
    assignment_id: Joi.string().guid().optional(),
    changed_by: Joi.number().integer().positive().optional()
  }),

  // A customer's return of one delivered item. photo: the JPEG or PNG as plain base64 (no data: prefix), 5 MB at most.
  requestReturn: Joi.object({
    order_item_id: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().min(1).required(),
    reason: Joi.string().valid(...CUSTOMER_RETURN_REASONS).required(),
    note: Joi.string().trim().max(500).allow(null, "")
      .when("reason", { is: "OTHER", then: Joi.string().trim().min(3).required() }),
    photo: Joi.string().base64().max(7 * 1024 * 1024).optional()
  }),

  reviewReturn: Joi.object({
    decision: Joi.string().valid("APPROVE", "REJECT").required(),
    pickup: Joi.boolean().when("decision", { is: "APPROVE", then: Joi.required(), otherwise: Joi.forbidden() }),
    reject_reason: Joi.string().valid(...RETURN_REJECT_REASONS)
      .when("decision", { is: "REJECT", then: Joi.required(), otherwise: Joi.forbidden() }),
    sent_variant_id: Joi.number().integer().positive()
      .when("decision", { is: "APPROVE", then: Joi.optional(), otherwise: Joi.forbidden() })
  }),

  returnPickup: Joi.object({
    assignment_id: Joi.string().guid().required(),
    step: Joi.string().valid("ASSIGNED", "COLLECTED", "FAILED", "UNASSIGNED").required(),
    changed_by: Joi.number().integer().positive().optional()
  }),

  inspectReturns: Joi.object({
    items: Joi.array().min(1).items(Joi.object({
      return_id: Joi.number().integer().positive().required(),
      restock_qty: Joi.number().integer().min(0).required(),
      write_off_qty: Joi.number().integer().min(0).required()
    })).required()
  }),

  updateOrderItemStatus: Joi.object({
    status: Joi.string().valid("READY", "NOT_AVAILABLE").required(),
    remarks: Joi.string().allow(null, "").optional()
  }),

  packOrder: Joi.object({
    bag_count: Joi.number().integer().min(1).max(20).required(),
    rack_label: Joi.string().trim().max(20).allow(null, "").optional()
  }),

  confirmPartialOrder: Joi.object({
    decision: Joi.string().valid("ACCEPT_PARTIAL", "CANCEL_ORDER").required()
  }),

  paymentCallback: Joi.object({
    transaction_id: Joi.string().max(255).allow(null, "").optional(),
    gateway_response: Joi.alternatives().try(Joi.object(), Joi.string()).optional(),
    remarks: Joi.string().allow(null, "").optional()
  }),

  retryPayment: Joi.object({
    payment_method: Joi.string().valid("UPI", "CARD", "NET_BANKING", "WALLET").optional(),
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
