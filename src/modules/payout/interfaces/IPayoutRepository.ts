import { Payout, PayoutStatus } from '@prisma/client';

export interface IPayoutRepository {
  createPayout(data: { driverProfileId: string; tripId?: string; amount: number; iban: string; }): Promise<Payout>;
  updatePayoutStatus(id: string, status: PayoutStatus, referenceNumber?: string, adminNotes?: string): Promise<Payout>;
  getPayoutsByDriver(driverProfileId: string): Promise<Payout[]>;
}
