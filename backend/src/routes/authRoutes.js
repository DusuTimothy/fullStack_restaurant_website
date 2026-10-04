const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { authenticateUser } = require('../middlewares/auth');
const { signupSchema, loginSchema } = require('../schemas/authSchema');

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticateUser, authController.getMe);

module.exports = router;
