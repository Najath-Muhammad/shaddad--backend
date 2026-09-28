import { z } from 'zod';
import { AppConstants } from '../../../common/constants/AppConstants.js';

export const RegisterDriverSchema = z.object({
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
  nationalIdNumber: z
    .string()
    .trim()
    .regex(/^[12]\d{9}$/, 'National ID or Iqama must be exactly 10 digits starting with 1 or 2')
    .optional(),
  licenseNumber: z.string().trim().optional(),
});

export type RegisterDriverDTO = z.infer<typeof RegisterDriverSchema>;
