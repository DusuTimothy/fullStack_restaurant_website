const userService = require('../services/userService');

/**
 * GET /api/users
 * Fetches all users (Admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 * Fetches user profile by ID with associated orders.
 * Access restricted to administrators or the owner of the profile.
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const targetId = parseInt(id, 10);

    // Only administrators or the user themselves can view this user profile
    if (!userService.canAccessUserProfile(req.user, targetId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only view your own user profile',
      });
    }

    const user = await userService.getUserByIdWithOrders(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: `User with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users
 * Admin-only user creation
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, role, phone, password } = req.body;

    if (role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Administrator accounts cannot be created via the API',
        details: [
          {
            field: 'role',
            message: 'Administrator accounts must be provisioned via the trusted operator CLI (npm run admin:create).',
          },
        ],
      });
    }

    const emailInUse = await userService.isEmailTaken(email);
    if (emailInUse) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists',
        details: [{ field: 'email', message: 'A user with this email already exists' }],
      });
    }

    const user = await userService.createUser({ name, email, role, phone, password });
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id
 * Updates user profile by ID.
 * Access restricted to administrators or the owner of the profile.
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const targetId = parseInt(id, 10);

    // Only administrators or the user themselves can update this user profile
    if (!userService.canAccessUserProfile(req.user, targetId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only update your own user profile',
      });
    }

    const user = await userService.findUserById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: `User with ID ${id} not found`,
      });
    }

    // Sanitize updates (non-admins cannot alter their role)
    const updates = userService.sanitizeUserUpdates(req.body, req.user);

    if (updates.email && updates.email !== user.email) {
      const emailInUse = await userService.isEmailTaken(updates.email);
      if (emailInUse) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists',
          details: [{ field: 'email', message: 'A user with this email already exists' }],
        });
      }
    }

    await userService.updateUser(user, updates);

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id
 * Deletes user by ID (Admin only)
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.findUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: `User with ID ${id} not found`,
      });
    }

    await userService.deleteUser(user);
    return res.status(200).json({
      success: true,
      message: `User with ID ${id} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
