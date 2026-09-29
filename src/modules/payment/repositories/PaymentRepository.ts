import { PrismaClient, Payment, PaymentStatus } from '@prisma/client';
import { IPaymentRepository } from '../interfaces/IPaymentRepository.js';

export class PaymentRepository implements IPaymentRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async createPayment(data: { tripId: string; amount: number; currency: string; gateway: string; gatewayPaymentId: string }): Promise<Payment> {
    return this._prisma.payment.upsert({
      where: { tripId: data.tripId },
      update: {
        amount: data.amount,
        currency: data.currency,
        gateway: data.gateway,
        gatewayPaymentId: data.gatewayPaymentId,
        status: PaymentStatus.PENDING
      },
      create: {
        tripId: data.tripId,
        amount: data.amount,
        currency: data.currency,
        gateway: data.gateway,
        gatewayPaymentId: data.gatewayPaymentId,
        status: PaymentStatus.PENDING
      }
    });
  }

  async updatePaymentStatus(gatewayPaymentId: string, status: PaymentStatus, rawResponse?: any): Promise<Payment> {
    return this._prisma.payment.update({
      where: { gatewayPaymentId },
      data: { status, rawResponse }
    });
  }

  async getPaymentByTripId(tripId: string): Promise<Payment | null> {
    return this._prisma.payment.findUnique({ where: { tripId } });
  }

  async getPaymentByGatewayId(gatewayPaymentId: string): Promise<Payment | null> {
    return this._prisma.payment.findUnique({ where: { gatewayPaymentId } });
  }
}
