import { z } from 'zod';
import { UserRole } from '../../../common/constants/AppConstants.js';

export const LoginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'Identifier (phone or email) is required'),
  password: z
    .string()
    .min(1, 'Password is required'),
  expectedRole: z
    .enum([UserRole.CUSTOMER, UserRole.DRIVER, UserRole.ADMIN])
    .optional(),
});

export type LoginDTO = z.infer<typeof LoginSchema>;
