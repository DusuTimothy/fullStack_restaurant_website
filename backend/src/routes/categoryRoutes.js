const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const validate = require('../middlewares/validate');
const { requireAdmin } = require('../middlewares/auth');
const { createCategorySchema, updateCategorySchema } = require('../schemas/categorySchema');

// Public endpoints: Anyone can view categories
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Admin-only endpoints: Only administrators can modify menu categories
router.post('/', requireAdmin, validate(createCategorySchema), categoryController.createCategory);
router.put('/:id', requireAdmin, validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', requireAdmin, categoryController.deleteCategory);

module.exports = router;
