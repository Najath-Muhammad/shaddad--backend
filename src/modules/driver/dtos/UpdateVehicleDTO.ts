import { z } from 'zod';
import { VehicleType } from '../../../common/constants/AppConstants.js';

export const UpdateVehicleSchema = z.object({
  vehicleType: z
    .enum([
      VehicleType.DYNA,
      VehicleType.PICKUP_SMALL,
      VehicleType.PICKUP_LARGE,
      VehicleType.TRAILER,
      VehicleType.FLATBED,
      VehicleType.REFRIGERATED,
      VehicleType.BOX_TRUCK,
    ])
    .optional(),
  make: z.string().min(1).max(100).optional(),
  model: z.string().min(1).max(100).optional(),
  year: z
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1)
    .optional(),
  plateNumber: z.string().min(1).max(20).toUpperCase().optional(),
  color: z.string().min(1).max(50).optional(),
  maxWeightKg: z.number().positive().optional(),
  maxLengthCm: z.number().positive().optional(),
  isRefrigerated: z.boolean().optional(),
});

export type UpdateVehicleDTO = z.infer<typeof UpdateVehicleSchema>;
