import { VehicleType } from '@prisma/client';
import { IPricingService, PricingBreakdownDTO } from '../interfaces/IPricingService.js';
import { IPricingRepository } from '../interfaces/IPricingRepository.js';
import { AppError } from '../../../common/errors/AppError.js';
import { HttpStatusCodes } from '../../../common/constants/HttpStatusCodes.js';

export class PricingService implements IPricingService {
  constructor(private readonly _pricingRepository: IPricingRepository) {}

  async calculatePrice(vehicleType: VehicleType, distanceKm: number, weightKg: number): Promise<PricingBreakdownDTO> {
    const config = await this._pricingRepository.getConfig(vehicleType);
    if (!config || !config.isActive) {
      throw new AppError('Pricing configuration not found or inactive for this vehicle type', HttpStatusCodes.BAD_REQUEST, 'PRICING_ERROR');
    }

    const baseFare = Number(config.baseFare);
    const perKmRate = Number(config.perKmRate);
    const perKgRate = Number(config.perKgRate);
    const commissionPercentage = Number(config.commissionPercentage);

    const distanceCharge = Number((distanceKm * perKmRate).toFixed(2));
    const weightCharge = Number((weightKg * perKgRate).toFixed(2));
    
    // Vehicle charge could be an additional static fee based on type, but we bake it into baseFare for now, so 0.
    const vehicleCharge = 0; 
    
    const subtotal = Number((baseFare + distanceCharge + vehicleCharge + weightCharge).toFixed(2));
    
    const commission = Number(((subtotal * commissionPercentage) / 100).toFixed(2));
    const driverEarnings = Number((subtotal - commission).toFixed(2));
    const totalPrice = subtotal; // Assuming total price for customer is the subtotal (driver + commission).

    return {
      baseFare,
      distanceCharge,
      vehicleCharge,
      weightCharge,
      subtotal,
      commission,
      driverEarnings,
      totalPrice
    };
  }
}
