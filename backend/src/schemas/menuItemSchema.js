const { z } = require('zod');

// Helpers for preprocessing multipart form-data fields
const preprocessNumber = (val) => {
  if (val === undefined || val === null || val === '') return undefined;
  const num = Number(val);
  return isNaN(num) ? val : num;
};

const preprocessInteger = (val) => {
  if (val === undefined || val === null || val === '') return undefined;
  const num = parseInt(val, 10);
  return isNaN(num) ? val : num;
};

const preprocessBoolean = (val) => {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    if (lower === 'true' || lower === '1') return true;
    if (lower === 'false' || lower === '0') return false;
  }
  return val;
};

const createMenuItemSchema = z.object({
  name: z
    .string({ required_error: 'Menu item name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(150, 'Name cannot exceed 150 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .nullable(),
  price: z.preprocess(
    preprocessNumber,
    z
      .number({ required_error: 'Price is required', invalid_type_error: 'Price must be a valid number' })
      .positive('Price must be greater than 0')
      .max(99999.99, 'Price is too high')
  ),
  categoryId: z.preprocess(
    preprocessInteger,
    z
      .number({ required_error: 'Category ID is required', invalid_type_error: 'Category ID must be an integer' })
      .int('Category ID must be an integer')
      .positive('Category ID must be a positive integer')
  ),
  isAvailable: z.preprocess(
    preprocessBoolean,
    z.boolean({ invalid_type_error: 'isAvailable must be a boolean' }).optional().default(true)
  ),
  imageUrl: z.string().trim().optional().nullable(),
});

const updateMenuItemSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  price: z.preprocess(
    preprocessNumber,
    z.number().positive('Price must be greater than 0').max(99999.99).optional()
  ),
  categoryId: z.preprocess(
    preprocessInteger,
    z.number().int().positive('Category ID must be a positive integer').optional()
  ),
  isAvailable: z.preprocess(
    preprocessBoolean,
    z.boolean().optional()
  ),
  imageUrl: z.string().trim().optional().nullable(),
});

module.exports = {
  createMenuItemSchema,
  updateMenuItemSchema,
};
