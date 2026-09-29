import { Payment } from '@prisma/client';

export interface IPaymentService {
  initiatePayment(customerId: string, tripId: string): Promise<{ clientSecret: string, payment: Payment }>;
  handleWebhook(rawBody: string | Buffer, signature: string): Promise<void>;
}
