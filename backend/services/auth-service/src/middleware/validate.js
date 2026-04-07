import AppError from "../utils/AppError.js";

const validate = (schema) => (req, res, next) => {
  try {
    const validatedData = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    req.validatedBody = validatedData.body;
    req.validatedQuery = validatedData.query;
    req.validatedParams = validatedData.params;

    next();
  } catch (error) {
    const errorMessage = error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    
    next(new AppError(`Validation failed: ${errorMessage}`, 400));
  }
};

export default validate;
