import { z } from 'zod';
import { TripStatus } from '@prisma/client';

export const UpdateTripStatusSchema = z.object({
  status: z.nativeEnum(TripStatus)
});

export const SubmitDeliveryProofSchema = z.object({
  otp: z.string().length(4),
  photoUrl: z.string().optional()
});
