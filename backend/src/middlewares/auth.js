const { User } = require('../models');
const { verifyToken } = require('../utils/token');

/**
 * Middleware to authenticate user using signed JSON Web Tokens (JWT).
 * Does NOT treat user IDs or x-user-id as proof of identity.
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid Bearer token.',
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization header format. Expected Bearer <token>.',
      });
    }

    const token = parts[1].trim();

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication token.',
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token payload.',
      });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User associated with this token not found.',
      });
    }

    if (user.isRestricted) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been restricted by an administrator. Please contact support.',
        isRestricted: true,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to enforce Admin role
 */
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return authenticateUser(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Administrator privileges required.',
        });
      }
      next();
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Administrator privileges required.',
    });
  }

  next();
};

/**
 * Optional user attachment (does not reject if token is not present, but populates req.user if valid token exists)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.substring(7).trim();
      const decoded = verifyToken(token);
      if (decoded && decoded.id) {
        const user = await User.findByPk(decoded.id);
        if (user) {
          req.user = user;
        }
      }
    }
  } catch {
    // Ignore errors for optional auth
  }
  next();
};

module.exports = {
  authenticateUser,
  requireAdmin,
  optionalAuth,
};
