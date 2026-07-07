import joi from "joi";
import ResponseUtil from "../utils/response.js";

const schemas = {
  addToCart: joi.object({
    cart_id: joi.number().integer().optional(),
    variant_id: joi.number().integer().required(),
    quantity: joi.number().integer().positive().required(),
  }),


}


const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schemas[schema].validate(req.body);
    console.log("Body:", req.body);
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return ResponseUtil.validationError(res, errors);
    }

    next();
  };
};

export default validate;