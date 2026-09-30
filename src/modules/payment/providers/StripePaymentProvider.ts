import Stripe from 'stripe';
import { IPaymentProvider, InitiatePaymentResult, WebhookVerificationResult } from '../interfaces/IPaymentProvider.js';
import { AppError } from '../../../common/errors/AppError.js';
import { HttpStatusCodes } from '../../../common/constants/HttpStatusCodes.js';

export class StripePaymentProvider implements IPaymentProvider {
  private _stripe: Stripe;
  private _webhookSecret: string;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';
    this._webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy';
    this._stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20' as any
    });
  }

  async initiatePayment(tripId: string, amount: number, currency: string = 'SAR'): Promise<InitiatePaymentResult> {
    try {
      // Stripe amounts are in cents/halalas
      const amountInCents = Math.round(amount * 100);

      // Mock behavior for missing Stripe Keys
      if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_dummy') {
        return {
          clientSecret: 'pi_dummy_secret_test_123',
          paymentId: 'pi_dummy_123'
        };
      }

      const paymentIntent = await this._stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        metadata: { tripId }
      });

      if (!paymentIntent.client_secret) {
        throw new Error('Failed to generate client secret');
      }

      return {
        clientSecret: paymentIntent.client_secret,
        paymentId: paymentIntent.id
      };
    } catch (error: any) {
      throw new AppError(`Stripe Error: ${error.message}`, HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  verifyWebhook(rawBody: string | Buffer, signature: string): WebhookVerificationResult {
    try {
      // Allow simulation in non-production environments regardless of webhook secret
      if (signature === 'mock_signature' && process.env.NODE_ENV !== 'production') {
        return { isValid: true, event: JSON.parse(rawBody.toString()) };
      }
      const event = this._stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this._webhookSecret
      );
      return { isValid: true, event };
    } catch (err: any) {
      return { isValid: false, error: err.message };
    }
  }
}
