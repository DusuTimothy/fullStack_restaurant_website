const menuItemService = require('../services/menuItemService');
const categoryService = require('../services/categoryService');

// GET /api/menu-items?category_id=X
const getAllMenuItems = async (req, res, next) => {
  try {
    const categoryId = req.query.category_id || req.query.categoryId;
    const isAvailable = req.query.isAvailable;

    const menuItems = await menuItemService.getAllMenuItems({ categoryId, isAvailable });

    return res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/menu-items/:id
const getMenuItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const menuItem = await menuItemService.getMenuItemById(id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: `Menu item with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/menu-items (supports multipart/form-data with file upload or JSON)
const createMenuItem = async (req, res, next) => {
  try {
    const { name, description, price, categoryId, isAvailable } = req.body;

    // Check if category exists
    const category = await categoryService.findCategoryById(categoryId);
    if (!category) {
      if (req.file) {
        menuItemService.removeUploadedFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        error: `Category with ID ${categoryId} does not exist`,
        details: [{ field: 'categoryId', message: `Category with ID ${categoryId} does not exist` }],
      });
    }

    let imageUrl = req.body.imageUrl || null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const createdItem = await menuItemService.createMenuItem({
      name,
      description,
      price,
      categoryId,
      isAvailable,
      imageUrl,
    });

    return res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: createdItem,
    });
  } catch (error) {
    if (req.file) {
      menuItemService.removeUploadedFile(req.file.path);
    }
    next(error);
  }
};

// PUT /api/menu-items/:id
const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const menuItem = await menuItemService.findMenuItemById(id);

    if (!menuItem) {
      if (req.file) {
        menuItemService.removeUploadedFile(req.file.path);
      }
      return res.status(404).json({
        success: false,
        error: `Menu item with ID ${id} not found`,
      });
    }

    if (req.body.categoryId) {
      const category = await categoryService.findCategoryById(req.body.categoryId);
      if (!category) {
        if (req.file) {
          menuItemService.removeUploadedFile(req.file.path);
        }
        return res.status(400).json({
          success: false,
          error: `Category with ID ${req.body.categoryId} does not exist`,
          details: [{ field: 'categoryId', message: `Category with ID ${req.body.categoryId} does not exist` }],
        });
      }
    }

    const updatedItem = await menuItemService.updateMenuItem(menuItem, req.body, req.file);

    return res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: updatedItem,
    });
  } catch (error) {
    if (req.file) {
      menuItemService.removeUploadedFile(req.file.path);
    }
    next(error);
  }
};

// DELETE /api/menu-items/:id
const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const menuItem = await menuItemService.findMenuItemById(id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: `Menu item with ID ${id} not found`,
      });
    }

    await menuItemService.deleteMenuItem(menuItem);

    return res.status(200).json({
      success: true,
      message: `Menu item with ID ${id} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
