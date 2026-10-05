const bcrypt = require('bcryptjs');
const { User, Order } = require('../models');

/**
 * Checks if the requesting user has permission to access or mutate the target user's profile.
 * Admins can access any profile. Non-admins can only access their own profile.
 *
 * @param {object} currentUser - Authenticated user object from req.user
 * @param {number|string} targetUserId - The ID of the target user profile
 * @returns {boolean}
 */
const canAccessUserProfile = (currentUser, targetUserId) => {
  if (!currentUser) return false;
  if (currentUser.role === 'admin') return true;
  return currentUser.id === parseInt(targetUserId, 10);
};

/**
 * Strips restricted fields from update data based on user privileges.
 * Non-admins cannot alter their role.
 *
 * @param {object} updates - Raw update payload from req.body
 * @param {object} currentUser - Authenticated user object from req.user
 * @returns {object} Sanitized update payload
 */
const sanitizeUserUpdates = (updates, currentUser) => {
  const sanitized = { ...updates };
  if (!currentUser || currentUser.role !== 'admin') {
    delete sanitized.role;
    delete sanitized.isRestricted;
  }
  // Admin role cannot be granted via ordinary user updates; it must use the trusted operator CLI
  if (sanitized.role === 'admin') {
    delete sanitized.role;
  }
  return sanitized;
};

/**
 * Hashes a plaintext password with bcrypt.
 *
 * @param {string} password - Raw plaintext password
 * @returns {Promise<string|null>} Hashed password string or null if empty
 */
const hashPassword = async (password) => {
  if (!password) return null;
  return await bcrypt.hash(password, 10);
};

/**
 * Finds a user by email address.
 *
 * @param {string} email - Email address to search for
 * @returns {Promise<User|null>}
 */
const findUserByEmail = async (email) => {
  return await User.findOne({ where: { email } });
};

/**
 * Checks whether an email is already in use by any user.
 *
 * @param {string} email - Email address to check
 * @returns {Promise<boolean>} True if email exists, false otherwise
 */
const isEmailTaken = async (email) => {
  const existing = await findUserByEmail(email);
  return Boolean(existing);
};

/**
 * Retrieves all users from the database ordered by ID ascending.
 *
 * @returns {Promise<User[]>}
 */
const getAllUsers = async () => {
  return await User.findAll({
    order: [['id', 'ASC']],
  });
};

/**
 * Finds a user by ID without associations.
 *
 * @param {number|string} id - User ID
 * @returns {Promise<User|null>}
 */
const findUserById = async (id) => {
  return await User.findByPk(id);
};

/**
 * Retrieves a user by ID including their associated orders.
 *
 * @param {number|string} id - User ID
 * @returns {Promise<User|null>}
 */
const getUserByIdWithOrders = async (id) => {
  return await User.findByPk(id, {
    include: [
      {
        model: Order,
        as: 'orders',
      },
    ],
  });
};

/**
 * Creates a new user record, hashing the password if provided.
 *
 * @param {object} userData - User creation attributes
 * @returns {Promise<User>} Created user instance
 */
const createUser = async ({ name, email, role, phone, password, isRestricted = false }) => {
  const hashedPassword = password ? await hashPassword(password) : null;
  return await User.create({
    name,
    email,
    role,
    phone,
    password: hashedPassword,
    isRestricted: Boolean(isRestricted),
  });
};

/**
 * Updates an existing user instance, hashing new password if present.
 *
 * @param {User} user - Sequelize User model instance to update
 * @param {object} updates - Fields to update
 * @returns {Promise<User>} Updated user instance
 */
const updateUser = async (user, updates) => {
  const payload = { ...updates };
  if (payload.password) {
    payload.password = await hashPassword(payload.password);
  }
  return await user.update(payload);
};

/**
 * Deletes an existing user instance from the database.
 *
 * @param {User} user - Sequelize User model instance to delete
 * @returns {Promise<void>}
 */
const deleteUser = async (user) => {
  return await user.destroy();
};

module.exports = {
  canAccessUserProfile,
  sanitizeUserUpdates,
  hashPassword,
  findUserByEmail,
  isEmailTaken,
  getAllUsers,
  findUserById,
  getUserByIdWithOrders,
  createUser,
  updateUser,
  deleteUser,
};
