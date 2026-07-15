import Joi from "joi";

const addressPayload = {
  address_type: Joi.string().valid("HOME", "WORK", "OTHER").required(),
  full_name: Joi.string().max(150).required(),
  phone: Joi.string().max(15).required(),
  address_line_1: Joi.string().max(255).required(),
  address_line_2: Joi.string().max(255).allow("", null).optional(),
  landmark: Joi.string().max(255).allow("", null).optional(),
  city: Joi.string().max(100).required(),
  state: Joi.string().max(100).required(),
  country: Joi.string().max(100).required(),
  postal_code: Joi.string().max(20).required(),
  latitude: Joi.number().precision(8).min(-90).max(90).allow(null).optional(),
  longitude: Joi.number().precision(8).min(-180).max(180).allow(null).optional(),
  delivery_instructions: Joi.string().allow("", null).optional(),
  is_default: Joi.boolean().optional(),
  is_active: Joi.boolean().optional()
};

const schemas = {
  createAddress: Joi.object(addressPayload),
  updateAddress: Joi.object({
    ...addressPayload,
    address_type: addressPayload.address_type.optional(),
    full_name: addressPayload.full_name.optional(),
    phone: addressPayload.phone.optional(),
    address_line_1: addressPayload.address_line_1.optional(),
    city: addressPayload.city.optional(),
    state: addressPayload.state.optional(),
    country: addressPayload.country.optional(),
    postal_code: addressPayload.postal_code.optional()
  }).min(1)
};

const validateAddress = (schemaName) => {
  return (req, res, next) => {
    const { error, value } = schemas[schemaName].validate(req.body);

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors
      });
    }

    req.body = value;
    next();
  };
};

export default validateAddress;
