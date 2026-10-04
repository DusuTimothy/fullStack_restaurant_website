const { z } = require('zod');

const orderItemInputSchema = z.object({
  menuItemId: z.preprocess(
    (val) => (val !== undefined && val !== null ? parseInt(val, 10) : val),
    z
      .number({ required_error: 'Menu item ID is required', invalid_type_error: 'Menu item ID must be an integer' })
      .int('Menu item ID must be an integer')
      .positive('Menu item ID must be a positive integer')
  ),
  quantity: z.preprocess(
    (val) => (val !== undefined && val !== null ? parseInt(val, 10) : 1),
    z
      .number({ invalid_type_error: 'Quantity must be an integer' })
      .int('Quantity must be an integer')
      .min(1, 'Quantity must be at least 1')
      .max(100, 'Maximum quantity per item is 100')
      .default(1)
  ),
});

const createOrderSchema = z.object({
  userId: z.preprocess(
    (val) => (val !== undefined && val !== null ? parseInt(val, 10) : undefined),
    z
      .number({ invalid_type_error: 'User ID must be an integer' })
      .int('User ID must be an integer')
      .positive('User ID must be a positive integer')
      .optional()
  ),
  notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters').optional().nullable(),
  items: z
    .array(orderItemInputSchema, {
      required_error: 'Order items are required',
      invalid_type_error: 'Items must be an array of order items',
    })
    .min(1, 'Order must contain at least one item'),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'completed', 'cancelled'], {
    errorMap: () => ({ message: "Status must be 'pending', 'preparing', 'ready', 'completed', or 'cancelled'" }),
  }),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
};
