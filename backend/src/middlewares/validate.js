/**
 * Reusable Zod validation middleware
 * Parses request payload (body, query, or params) and returns structured { field, message } errors on failure.
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const validatedData = schema.parse(req[source]);
    req[source] = validatedData;
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const details = error.errors.map((err) => ({
        field: err.path.join('.') || 'root',
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details,
      });
    }
    next(error);
  }
};

module.exports = validate;
