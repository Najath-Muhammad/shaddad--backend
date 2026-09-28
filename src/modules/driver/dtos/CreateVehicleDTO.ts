import { z } from 'zod';
import { VehicleType } from '../../../common/constants/AppConstants.js';

export const CreateVehicleSchema = z.object({
  vehicleType: z.enum([
    VehicleType.DYNA,
    VehicleType.PICKUP_SMALL,
    VehicleType.PICKUP_LARGE,
    VehicleType.TRAILER,
    VehicleType.FLATBED,
    VehicleType.REFRIGERATED,
    VehicleType.BOX_TRUCK,
  ]),
  make: z.string().min(1, 'Make is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  year: z
    .number()
    .int()
    .min(1990, 'Year must be 1990 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
  plateNumber: z
    .string()
    .min(1, 'Plate number is required')
    .max(20)
    .toUpperCase(),
  color: z.string().min(1, 'Color is required').max(50),
  maxWeightKg: z.number().positive('Max weight must be positive'),
  maxLengthCm: z.number().positive('Max length must be positive').optional(),
  isRefrigerated: z.boolean().default(false),
});

export type CreateVehicleDTO = z.infer<typeof CreateVehicleSchema>;
