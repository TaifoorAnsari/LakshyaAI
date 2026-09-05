/**
 * Zod Request Validation Middleware
 * 
 * Intercepts incoming requests and validates their body, query, and params
 * against a provided Zod schema before controllers execute.
 * 
 * Returns formatted 400 Bad Request if validation fails.
 */

const { AppError } = require('./errorHandler');

const validate = (schema) => async (req, res, next) => {
  try {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Assign sanitized / coerced values back to request
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
  } catch (error) {
    if (error.errors) {
      // Format Zod issues into clear field-specific error messages
      const details = error.errors.map((err) => ({
        field: err.path.join('.').replace(/^(body|query|params)\./, ''),
        message: err.message,
      }));

      const combinedMessage = details.map((d) => d.message).join('. ');
      const appErr = new AppError(combinedMessage, 400, 'ERR_VALIDATION');
      appErr.details = details;
      return next(appErr);
    }
    next(error);
  }
};

module.exports = { validate };
