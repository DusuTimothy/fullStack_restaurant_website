const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { signToken } = require('../utils/token');

/**
 * Normalizes an email address.
 *
 * @param {string} email
 * @returns {string}
 */
const normalizeEmail = (email) => {
  return email ? email.toLowerCase().trim() : '';
};

/**
 * Finds user by email with password included.
 *
 * @param {string} email
 * @returns {Promise<User|null>}
 */
const findUserWithPasswordByEmail = async (email) => {
  return await User.scope('withPassword').findOne({
    where: { email: normalizeEmail(email) },
  });
};

/**
 * Generates JWT token and sanitizes user profile for response.
 *
 * @param {User} user
 * @returns {{ token: string, user: object }}
 */
const generateAuthPayload = (user) => {
  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isRestricted: Boolean(user.isRestricted),
      createdAt: user.createdAt,
    },
  };
};

/**
 * Signs up a new user (customer, staff, or admin) or activates an account.
 *
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} [params.phone]
 * @param {string} [params.role='customer']
 * @returns {Promise<{ error?: string, conflictType?: string, details?: Array<{field: string, message: string}>, data?: object }>}
 */
const registerUser = async ({ name, email, password, phone, role = 'customer' }) => {
  const normalized = normalizeEmail(email);
  const existingUser = await findUserWithPasswordByEmail(normalized);

  const hashedPassword = await bcrypt.hash(password, 10);
  const validRoles = ['customer', 'staff', 'admin'];
  const userRole = validRoles.includes(role) ? role : 'customer';

  if (existingUser) {
    if (existingUser.password) {
      return {
        error: 'Email already exists',
        conflictType: 'EXISTING_PASSWORD',
        details: [{ field: 'email', message: 'An account with this email already exists' }],
      };
    }

    await existingUser.update({
      name: name.trim(),
      password: hashedPassword,
      phone: phone ? phone.trim() : existingUser.phone,
      role: userRole,
    });

    return { data: generateAuthPayload(existingUser) };
  }

  const newUser = await User.create({
    name: name.trim(),
    email: normalized,
    password: hashedPassword,
    phone: phone ? phone.trim() : null,
    role: userRole,
    isRestricted: false,
  });

  return { data: generateAuthPayload(newUser) };
};

const registerCustomer = registerUser;

/**
 * Authenticates user credentials.
 *
 * @param {object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{ error?: string, isRestricted?: boolean, data?: object }>}
 */
const authenticateUser = async ({ email, password }) => {
  const user = await findUserWithPasswordByEmail(email);

  if (!user || !user.password) {
    return { error: 'Invalid email or password' };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { error: 'Invalid email or password' };
  }

  if (user.isRestricted) {
    return {
      error: 'Your account has been restricted by an administrator. Please contact support.',
      isRestricted: true,
    };
  }

  return { data: generateAuthPayload(user) };
};

module.exports = {
  normalizeEmail,
  findUserWithPasswordByEmail,
  generateAuthPayload,
  registerUser,
  registerCustomer,
  authenticateUser,
};
