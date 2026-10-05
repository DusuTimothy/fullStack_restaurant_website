const path = require('path');
const fs = require('fs');
const { MenuItem, Category } = require('../models');

/**
 * Removes an uploaded file from disk if it points to an upload directory.
 *
 * @param {string} relativeOrFullPath
 */
const removeUploadedFile = (relativeOrFullPath) => {
  if (!relativeOrFullPath) return;
  const filePath = relativeOrFullPath.startsWith('/uploads/')
    ? path.join(__dirname, '../../', relativeOrFullPath)
    : relativeOrFullPath;

  fs.unlink(filePath, () => {});
};

/**
 * Retrieves all menu items matching query filters.
 *
 * @param {object} filters
 * @param {string|number} [filters.categoryId]
 * @param {string} [filters.isAvailable]
 * @returns {Promise<MenuItem[]>}
 */
const getAllMenuItems = async ({ categoryId, isAvailable }) => {
  const whereClause = {};

  if (categoryId) {
    const parsedCatId = parseInt(categoryId, 10);
    if (!isNaN(parsedCatId)) {
      whereClause.categoryId = parsedCatId;
    }
  }

  if (isAvailable !== undefined) {
    whereClause.isAvailable = isAvailable === 'true';
  }

  return await MenuItem.findAll({
    where: whereClause,
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name'],
      },
    ],
    order: [['id', 'ASC']],
  });
};

/**
 * Retrieves a menu item by ID with Category association.
 *
 * @param {number|string} id
 * @returns {Promise<MenuItem|null>}
 */
const getMenuItemById = async (id) => {
  return await MenuItem.findByPk(id, {
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name'],
      },
    ],
  });
};

/**
 * Finds a menu item by primary key.
 *
 * @param {number|string} id
 * @returns {Promise<MenuItem|null>}
 */
const findMenuItemById = async (id) => {
  return await MenuItem.findByPk(id);
};

/**
 * Creates a menu item and reloads with category details.
 *
 * @param {object} data
 * @returns {Promise<MenuItem>}
 */
const createMenuItem = async ({ name, description, price, categoryId, isAvailable, imageUrl }) => {
  const item = await MenuItem.create({
    name,
    description,
    price,
    categoryId,
    isAvailable: isAvailable !== undefined ? isAvailable : true,
    imageUrl: imageUrl || null,
  });

  return await MenuItem.findByPk(item.id, {
    include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
  });
};

/**
 * Updates a menu item and manages previous image cleanup if overwritten.
 *
 * @param {MenuItem} menuItem
 * @param {object} updateData
 * @param {object|null} file
 * @returns {Promise<MenuItem>}
 */
const updateMenuItem = async (menuItem, updateData, file) => {
  const payload = {};
  for (const [key, value] of Object.entries(updateData)) {
    if (value !== undefined) {
      payload[key] = value;
    }
  }

  if (file) {
    const oldImage = menuItem.imageUrl;
    payload.imageUrl = `/uploads/${file.filename}`;

    if (oldImage && oldImage.startsWith('/uploads/')) {
      removeUploadedFile(oldImage);
    }
  }

  await menuItem.update(payload);

  return await MenuItem.findByPk(menuItem.id, {
    include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
  });
};

/**
 * Deletes a menu item and removes any associated uploaded image file.
 *
 * @param {MenuItem} menuItem
 * @returns {Promise<void>}
 */
const deleteMenuItem = async (menuItem) => {
  const imagePath = menuItem.imageUrl;
  await menuItem.destroy();

  if (imagePath && imagePath.startsWith('/uploads/')) {
    removeUploadedFile(imagePath);
  }
};

module.exports = {
  removeUploadedFile,
  getAllMenuItems,
  getMenuItemById,
  findMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
