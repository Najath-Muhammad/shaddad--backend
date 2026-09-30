import { PrismaClient, Payout, PayoutStatus } from '@prisma/client';
import { IPayoutRepository } from '../interfaces/IPayoutRepository.js';

export class PayoutRepository implements IPayoutRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async createPayout(data: { driverProfileId: string; tripId?: string; amount: number; iban: string }): Promise<Payout> {
    return this._prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: {
          driverProfileId: data.driverProfileId,
          tripId: data.tripId,
          amount: data.amount,
          iban: data.iban,
          status: PayoutStatus.ELIGIBLE
        }
      });

      await tx.driverProfile.update({
        where: { id: data.driverProfileId },
        data: { walletBalance: { increment: data.amount } }
      });

      return payout;
    });
  }

  async updatePayoutStatus(id: string, status: PayoutStatus, referenceNumber?: string, adminNotes?: string): Promise<Payout> {
    return this._prisma.payout.update({
      where: { id },
      data: {
        status,
        referenceNumber,
        adminNotes,
        processedAt: status === PayoutStatus.PAID ? new Date() : undefined
      }
    });
  }

  async getPayoutsByDriver(driverProfileId: string): Promise<Payout[]> {
    return this._prisma.payout.findMany({
      where: { driverProfileId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
