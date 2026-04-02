/**
 * @function asyncHandler
 * @description Higher-order function to wrap async Express controllers,
 * catching rejected promises and passing them to the global error handler.
 */
const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
