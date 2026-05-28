/**
 * Async Handler Wrapper.
 * Wraps async route handlers so that any rejected promise
 * is automatically forwarded to Express's error handler
 * instead of crashing the server.
 *
 * Usage: router.get('/products', asyncHandler(controller.getAll));
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
