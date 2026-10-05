const authService = require('../services/authService');

/**
 * POST /api/auth/signup
 * Public customer signup.
 * Strictly forces role: 'customer' (ignores any client-provided role).
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const result = await authService.registerCustomer({ name, email, password, phone });

    if (result.error) {
      return res.status(409).json({
        success: false,
        error: result.error,
        details: result.details,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * User login with email and password.
 * Uses generic error for incorrect email/password or password-less legacy accounts.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.authenticateUser({ email, password });

    if (result.error) {
      const statusCode = result.isRestricted ? 403 : 401;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        isRestricted: Boolean(result.isRestricted),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns profile of currently authenticated user
 */
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getMe,
};
