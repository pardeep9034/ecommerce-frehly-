// auth.validation.js
import Joi from "joi";

/* ================= SIGNUP ================= */
const signupSchema = Joi.object({
    phone: Joi.string()
        .trim()
        .pattern(/^[0-9]{10}$/)
        .required()
        .messages({
            "string.base": "Phone number must be a string",
            "string.empty": "Phone number cannot be empty",
            "string.pattern.base": "Invalid phone number format",
            "any.required": "Phone number is required"
        })
});

/* ================= VERIFY OTP ================= */
const verifyOtpSchema = Joi.object({
    phone: Joi.string()
        .trim()
        .pattern(/^[0-9]{10}$/)
        .required()
        .messages({
            "string.pattern.base": "Invalid phone number format",
            "any.required": "Phone number is required"
        }),

    otp: Joi.string()
        .trim()
        .length(6)
        .pattern(/^[0-9]{6}$/)
        .required()
        .messages({
            "string.length": "OTP must be 6 digits",
            "string.pattern.base": "Invalid OTP format",
            "any.required": "OTP is required"
        })
});

/* ================= LOGIN ================= */
const loginSchema = Joi.object({
    phone: Joi.string()
        .trim()
        .pattern(/^[0-9]{10}$/)
        .required()
        .messages({
            "string.pattern.base": "Invalid phone number format",
            "any.required": "Phone number is required"
        })
});

class AuthValidation {

    validateSignup(data) {
        return this.#validate(data, signupSchema);
    }

    validateVerifyOtp(data) {
        return this.#validate(data, verifyOtpSchema);
    }

    validateLogin(data) {
        return this.#validate(data, loginSchema);
    }

    #validate(data, schema) {

        if (data) {

            const { error, value } = schema.validate(data, {
                abortEarly: true,
                stripUnknown: true
            });

            if (!error) {
                return {
                    valid: true,
                    sanitizedData: value
                };
            } else {
                return {
                    valid: false,
                    message: error.details[0].message
                };
            }

        } else {
            return {
                valid: false,
                message: "Invalid request payload"
            };
        }

    }

}

export default new AuthValidation();
