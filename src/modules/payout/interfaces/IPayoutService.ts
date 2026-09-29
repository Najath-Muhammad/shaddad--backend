import { Payout } from '@prisma/client';

export interface IPayoutService {
  createEligiblePayout(driverProfileId: string, tripId: string, amount: number): Promise<Payout>;
  processPayout(payoutId: string): Promise<Payout>;
  getDriverPayouts(driverProfileId: string): Promise<Payout[]>;
}
