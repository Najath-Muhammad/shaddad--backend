import { PrismaClient, PricingConfig, VehicleType } from '@prisma/client';
import { IPricingRepository } from '../interfaces/IPricingRepository.js';

export class PricingRepository implements IPricingRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async getConfig(vehicleType: VehicleType): Promise<PricingConfig | null> {
    return this._prisma.pricingConfig.findUnique({
      where: { vehicleType }
    });
  }
}
