import { Payment, PaymentStatus } from '@prisma/client';

export interface IPaymentRepository {
  createPayment(data: { tripId: string; amount: number; currency: string; gateway: string; gatewayPaymentId: string }): Promise<Payment>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updatePaymentStatus(gatewayPaymentId: string, status: PaymentStatus, rawResponse?: any): Promise<Payment>;
  getPaymentByTripId(tripId: string): Promise<Payment | null>;
  getPaymentByGatewayId(gatewayPaymentId: string): Promise<Payment | null>;
}
