// services/auth-service/src/middleware/validation.js
// const Joi = require('joi');
import Joi from 'joi';
// const ResponseUtil = require('../utils/response');
import ResponseUtil from '../utils/response.js';

// Validation schemas
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
    last_name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required(),

  }),

  login: Joi.object({
    phone:  Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
    password: Joi.string().required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).max(100).required(),
    
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
// 
// module.exports = { validate };
export { validate };