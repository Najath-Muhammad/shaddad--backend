import { PricingConfig, VehicleType } from '@prisma/client';

export interface IPricingRepository {
  getConfig(vehicleType: VehicleType): Promise<PricingConfig | null>;
}
