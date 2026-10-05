const { z } = require('zod');

const createUserSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address')
    .max(150, 'Email cannot exceed 150 characters'),
  role: z
    .enum(['customer', 'staff', 'admin'], {
      errorMap: () => ({ message: "Role must be 'customer', 'staff', or 'admin'" }),
    })
    .default('customer')
    .optional(),
  phone: z
    .string()
    .trim()
    .max(25, 'Phone number cannot exceed 25 characters')
    .optional()
    .nullable(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .optional()
    .nullable(),
  isRestricted: z
    .boolean()
    .optional(),
});

const updateUserSchema = createUserSchema.partial();

module.exports = {
  createUserSchema,
  updateUserSchema,
};
