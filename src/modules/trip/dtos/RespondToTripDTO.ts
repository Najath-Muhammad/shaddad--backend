import { z } from 'zod';

export const RespondToTripSchema = z.object({
  accept: z.boolean(),
  reason: z.string().optional()
});

export type RespondToTripDTO = z.infer<typeof RespondToTripSchema>;
