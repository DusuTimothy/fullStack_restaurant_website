const multer = require('multer');

// Centralized error handling middleware
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  // Multer errors (file size, file format, etc.)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds 2MB limit',
        details: [{ field: 'image', message: 'Maximum file size is 2MB' }],
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message,
      details: [{ field: 'image', message: err.message }],
    });
  }

  // Custom Multer file filter error
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: err.message,
      details: [{ field: 'image', message: err.message }],
    });
  }

  // Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const details = err.errors.map((e) => ({
      field: e.path,
      message: `${e.path} must be unique. Value '${e.value}' already exists.`,
    }));
    return res.status(409).json({
      success: false,
      error: 'Conflict: duplicate record',
      details,
    });
  }

  // Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    const details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: 'Database validation error',
      details,
    });
  }

  // Sequelize Foreign Key Constraint Error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      error: 'Foreign key constraint violated. Referenced record does not exist.',
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
