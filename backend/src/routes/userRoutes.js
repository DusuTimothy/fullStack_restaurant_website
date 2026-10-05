const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { authenticateUser, requireAdmin } = require('../middlewares/auth');
const { createUserSchema, updateUserSchema } = require('../schemas/userSchema');
const { signupSchema, loginSchema } = require('../schemas/authSchema');

// Public auth aliases under /users
router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);

// Protected user management routes
router.get('/', requireAdmin, userController.getAllUsers);
router.get('/me', authenticateUser, userController.getMyProfile);
router.get('/:id', authenticateUser, userController.getUserById);
router.post('/', requireAdmin, validate(createUserSchema), userController.createUser);
router.put('/:id', authenticateUser, validate(updateUserSchema), userController.updateUser);
router.patch('/:id/restrict', requireAdmin, userController.toggleRestrictUser);
router.delete('/:id', authenticateUser, userController.deleteUser);

module.exports = router;
