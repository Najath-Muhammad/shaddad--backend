import { z } from 'zod';
import { AppConstants } from '../../../common/constants/AppConstants.js';

export const RegisterCustomerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be at most 100 characters')
    .trim(),
  phoneNumber: z
    .string()
    .trim()
    .regex(AppConstants.PHONE_REGEX_SAUDI, 'Must be a valid Saudi phone number (e.g. +9665XXXXXXXX or 05XXXXXXXX)'),
  email: z
    .string()
    .trim()
    .email('Must be a valid email address')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type RegisterCustomerDTO = z.infer<typeof RegisterCustomerSchema>;
