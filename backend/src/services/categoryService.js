const { Category, MenuItem } = require('../models');

/**
 * Retrieves all categories with their associated menu item counts.
 *
 * @returns {Promise<Array<object>>}
 */
const getAllCategoriesWithItemCounts = async () => {
  const categories = await Category.findAll({
    order: [['id', 'ASC']],
    include: [
      {
        model: MenuItem,
        as: 'menuItems',
        attributes: ['id'],
      },
    ],
  });

  return categories.map((cat) => {
    const plain = cat.toJSON();
    plain.itemCount = plain.menuItems ? plain.menuItems.length : 0;
    return plain;
  });
};

/**
 * Retrieves a category by ID including full menu items.
 *
 * @param {number|string} id
 * @returns {Promise<Category|null>}
 */
const getCategoryById = async (id) => {
  return await Category.findByPk(id, {
    include: [
      {
        model: MenuItem,
        as: 'menuItems',
      },
    ],
  });
};

/**
 * Finds a category by primary key without associations.
 *
 * @param {number|string} id
 * @returns {Promise<Category|null>}
 */
const findCategoryById = async (id) => {
  return await Category.findByPk(id);
};

/**
 * Checks whether a category name is already in use.
 *
 * @param {string} name
 * @returns {Promise<boolean>}
 */
const isCategoryNameTaken = async (name) => {
  const existing = await Category.findOne({ where: { name } });
  return Boolean(existing);
};

/**
 * Creates a new category.
 *
 * @param {object} data
 * @param {string} data.name
 * @param {string} [data.description]
 * @returns {Promise<Category>}
 */
const createCategory = async ({ name, description }) => {
  return await Category.create({ name, description });
};

/**
 * Updates an existing category instance.
 *
 * @param {Category} category
 * @param {object} updates
 * @returns {Promise<Category>}
 */
const updateCategory = async (category, updates) => {
  return await category.update(updates);
};

/**
 * Counts how many menu items belong to a given category.
 *
 * @param {number|string} categoryId
 * @returns {Promise<number>}
 */
const countCategoryMenuItems = async (categoryId) => {
  return await MenuItem.count({ where: { categoryId } });
};

/**
 * Deletes a category instance.
 *
 * @param {Category} category
 * @returns {Promise<void>}
 */
const deleteCategory = async (category) => {
  return await category.destroy();
};

module.exports = {
  getAllCategoriesWithItemCounts,
  getCategoryById,
  findCategoryById,
  isCategoryNameTaken,
  createCategory,
  updateCategory,
  countCategoryMenuItems,
  deleteCategory,
};
