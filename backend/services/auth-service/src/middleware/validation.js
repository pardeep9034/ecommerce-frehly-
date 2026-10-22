
import Joi from 'joi';

import ResponseUtil from '../utils/response.js';
import { SIGNUP_ROLES, STAFF_ROLES } from '../constants/roles.js';


const schemas = {
  signUp: Joi.object({
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
  role: Joi.string().valid(...SIGNUP_ROLES)
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

  }),

  // Own profile. A new phone needs the code from POST /auth/profile/phone/otp; "" or null clears the email.
  updateProfile: Joi.object({
    first_name: Joi.string().trim().min(2).max(50),
    last_name: Joi.string().trim().max(50).allow("", null),
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).allow("", null),
    phone: Joi.string().pattern(/^[0-9]{10}$/),
    otp: Joi.string().pattern(/^[0-9]{4,8}$/),
  }).min(1),

  phoneChangeOtp: Joi.object({
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
  }),

  // Signed-in password change. Same strength rule as staff passwords (staff.service.js).
  changePassword: Joi.object({
    current_password: Joi.string().max(100).required(),
    new_password: Joi.string().min(8).max(100).pattern(/[A-Za-z]/).pattern(/\d/).required()
      .messages({ "string.min": "Password needs at least 8 characters", "string.pattern.base": "Password needs a letter and a number" }),
  }),

  internalPartner: Joi.object({
    phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
    name: Joi.string().trim().min(2).max(50).required(),
  }),

  internalUserNames: Joi.object({
    ids: Joi.array().items(Joi.number().integer().positive()).min(1).max(50).required(),
  }),

  // Who notification-service texts or emails: by user id or by role, never both. Staff + sign-up roles = every role on the model.
  internalUserContacts: Joi.object({
    ids: Joi.array().items(Joi.number().integer().positive()).min(1).max(50).unique(),
    roles: Joi.array().items(Joi.string().valid(...STAFF_ROLES, ...SIGNUP_ROLES)).min(1).max(5),
  }).xor("ids", "roles")
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