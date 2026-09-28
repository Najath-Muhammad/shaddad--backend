import { z } from 'zod';
import { DriverAvailability } from '../../../common/constants/AppConstants.js';

export const UpdateAvailabilitySchema = z.object({
  availability: z.enum([
    DriverAvailability.OFFLINE,
    DriverAvailability.ONLINE,
    DriverAvailability.BUSY,
  ]),
});

export type UpdateAvailabilityDTO = z.infer<typeof UpdateAvailabilitySchema>;
