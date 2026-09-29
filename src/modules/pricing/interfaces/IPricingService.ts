import { VehicleType } from '@prisma/client';

export interface PricingBreakdownDTO {
  baseFare: number;
  distanceCharge: number;
  vehicleCharge: number;
  weightCharge: number;
  subtotal: number;
  commission: number;
  driverEarnings: number;
  totalPrice: number;
}

export interface IPricingService {
  calculatePrice(
    vehicleType: VehicleType,
    distanceKm: number,
    weightKg: number
  ): Promise<PricingBreakdownDTO>;
}
