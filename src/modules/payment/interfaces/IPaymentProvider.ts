

export interface InitiatePaymentResult {
  clientSecret: string;
  paymentId: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  event?: any;
  error?: string;
}

export interface IPaymentProvider {
  initiatePayment(tripId: string, amount: number, currency?: string): Promise<InitiatePaymentResult>;
  verifyWebhook(rawBody: string | Buffer, signature: string): WebhookVerificationResult;
}
