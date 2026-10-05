const categoryService = require('../services/categoryService');

// GET /api/categories
const getAllCategories = async (req, res, next) => {
  try {
    const formatted = await categoryService.getAllCategoriesWithItemCounts();
    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/:id
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: `Category with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const nameExists = await categoryService.isCategoryNameTaken(name);
    if (nameExists) {
      return res.status(409).json({
        success: false,
        error: 'Category name already exists',
        details: [{ field: 'name', message: 'A category with this name already exists' }],
      });
    }

    const category = await categoryService.createCategory({ name, description });
    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await categoryService.findCategoryById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: `Category with ID ${id} not found`,
      });
    }

    if (req.body.name) {
      const nameExists = await categoryService.isCategoryNameTaken(req.body.name, id);
      if (nameExists) {
        return res.status(409).json({
          success: false,
          error: 'Category name already exists',
          details: [{ field: 'name', message: 'A category with this name already exists' }],
        });
      }
    }

    await categoryService.updateCategory(category, req.body);
    const plain = category.toJSON ? category.toJSON() : { ...category };
    plain.itemCount = await categoryService.countCategoryMenuItems(id);

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: plain,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await categoryService.findCategoryById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: `Category with ID ${id} not found`,
      });
    }

    const itemsCount = await categoryService.countCategoryMenuItems(id);
    if (itemsCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category. It contains ${itemsCount} menu item(s). Please reassign or delete them first.`,
      });
    }

    await categoryService.deleteCategory(category);
    return res.status(200).json({
      success: true,
      message: `Category with ID ${id} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
