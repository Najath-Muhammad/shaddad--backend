import { Request, Response, NextFunction } from 'express';
import { IPaymentService } from '../interfaces/IPaymentService.js';
import { HttpStatusCodes } from '../../../common/constants/HttpStatusCodes.js';
import { ApiResponseBuilder } from '../../../common/utils/ApiResponse.js';
import { PrismaClient } from '@prisma/client';

export class PaymentController {
  constructor(
    private readonly _paymentService: IPaymentService,
    private readonly _prisma: PrismaClient
  ) {}

  private async _getCustomerProfileId(userId: string): Promise<string> {
    const profile = await this._prisma.customerProfile.findUnique({ where: { userId } });
    if (!profile) throw new Error('Customer profile not found');
    return profile.id;
  }

  initiatePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerProfileId = await this._getCustomerProfileId(req.user!.userId);
      const result = await this._paymentService.initiatePayment(customerProfileId, req.params.tripId as string);
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(result, 'Payment intent created'));
    } catch (error) {
      next(error);
    }
  };

  simulateSuccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tripId = req.params.tripId as string;
      
      const payment = await this._prisma.payment.findUnique({ where: { tripId } });
      const gatewayPaymentId = payment?.gatewayPaymentId || 'pi_dummy_123';
      
      // In a real app we'd trigger webhook. Here we'll just mock the event.
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: gatewayPaymentId,
            amount: 1000,
            currency: 'sar',
            status: 'succeeded',
            metadata: { tripId }
          }
        }
      };
      
      await this._paymentService.handleWebhook(JSON.stringify(event), 'mock_signature');
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(null, 'Payment simulated'));
    } catch (error) {
      next(error);
    }
  };

  stripeWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      // Note: req.body MUST be raw buffer here. We will configure express in app.ts to use raw parser for this route.
      await this._paymentService.handleWebhook(req.body, signature);
      res.status(HttpStatusCodes.OK).send({ received: true });
    } catch (error) {
      // Stripe requires errors to be 400 for bad signatures
      res.status(HttpStatusCodes.BAD_REQUEST).send(`Webhook Error: ${(error as any).message}`);
    }
  };
}
