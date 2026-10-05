const express = require('express');
const router = express.Router();
const menuItemController = require('../controllers/menuItemController');
const upload = require('../middlewares/upload');
const validate = require('../middlewares/validate');
const { requireAdmin } = require('../middlewares/auth');
const { createMenuItemSchema, updateMenuItemSchema } = require('../schemas/menuItemSchema');

// Public endpoints: Anyone can view menu items
router.get('/', menuItemController.getAllMenuItems);
router.get('/:id', menuItemController.getMenuItemById);

// Admin-only endpoints: Only administrators can create, update, or delete menu items
router.post(
  '/',
  requireAdmin,
  upload.single('image'), 
  validate(createMenuItemSchema),
  menuItemController.createMenuItem
);

router.put(
  '/:id',
  requireAdmin,
  upload.single('image'),
  validate(updateMenuItemSchema),
  menuItemController.updateMenuItem
);

router.delete('/:id', requireAdmin, menuItemController.deleteMenuItem);

module.exports = router;
