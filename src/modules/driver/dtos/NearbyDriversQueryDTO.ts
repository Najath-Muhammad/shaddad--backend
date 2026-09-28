import { z } from 'zod';
import { AppConstants } from '../../../common/constants/AppConstants.js';

export const NearbyDriversQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce
    .number()
    .positive()
    .max(AppConstants.MAX_NEARBY_DRIVER_RADIUS_KM)
    .default(AppConstants.NEARBY_DRIVER_DEFAULT_RADIUS_KM),
  vehicleType: z.string().optional(),
});

export type NearbyDriversQueryDTO = z.infer<typeof NearbyDriversQuerySchema>;
