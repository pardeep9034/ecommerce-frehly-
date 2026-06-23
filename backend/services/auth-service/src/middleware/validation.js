
import Joi from 'joi';

import ResponseUtil from '../utils/response.js';


const schemas = {
  signUp: Joi.object({
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
}),

  register: Joi.object({
     phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
    first_name: Joi.string().min(2).max(50).required(),
    last_name: Joi.string().min(2).max(50),
    email: Joi.string().email(),
    password: Joi.string().min(6).max(100).required(),

  }),

  login: Joi.object({
    phone:  Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
    
  }),

  forgotPassword: Joi.object({
    phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
  }),

  resetPassword: Joi.object({
    resetToken: Joi.string().required(),
    newPassword: Joi.string().min(6).max(100).required(),
    
  })
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schemas[schema].validate(req.body);
    
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

export { validate };