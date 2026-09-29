import { z } from 'zod';
import { VehicleType } from '@prisma/client';

export const CreateTripSchema = z.object({
  driverProfileId: z.string().uuid(),
  pickupLatitude: z.number().min(-90).max(90),
  pickupLongitude: z.number().min(-180).max(180),
  pickupAddress: z.string().min(3),
  destinationLatitude: z.number().min(-90).max(90),
  destinationLongitude: z.number().min(-180).max(180),
  destinationAddress: z.string().min(3),
  pickupDateTime: z.string().datetime(),
  cargoType: z.string().min(2),
  weightKg: z.number().positive(),
  quantity: z.number().int().positive(),
  additionalRequirements: z.string().optional(),
});

export type CreateTripRequestDTO = z.infer<typeof CreateTripSchema>;

export const CalculatePriceSchema = z.object({
  pickupLatitude: z.number().min(-90).max(90),
  pickupLongitude: z.number().min(-180).max(180),
  destinationLatitude: z.number().min(-90).max(90),
  destinationLongitude: z.number().min(-180).max(180),
  weightKg: z.number().positive(),
  vehicleType: z.nativeEnum(VehicleType),
});

export type CalculatePriceDTO = z.infer<typeof CalculatePriceSchema>;
