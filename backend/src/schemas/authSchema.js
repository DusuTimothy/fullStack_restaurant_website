const { z } = require('zod');

const signupSchema = z.object({
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
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters'),
  phone: z
    .string()
    .trim()
    .max(25, 'Phone number cannot exceed 25 characters')
    .optional()
    .nullable(),
  role: z
    .enum(['customer', 'staff', 'admin'], {
      errorMap: () => ({ message: "Role must be 'customer', 'staff', or 'admin'" }),
    })
    .default('customer')
    .optional(),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

module.exports = {
  signupSchema,
  loginSchema,
};
