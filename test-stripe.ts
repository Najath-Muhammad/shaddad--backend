import { StripePaymentProvider } from './src/modules/payment/providers/StripePaymentProvider';

async function main() {
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'; // To test fallback
  const provider = new StripePaymentProvider();
  console.log('Testing Stripe Provider...');
  try {
    const res = await provider.initiatePayment('test_trip_123', 100, 'SAR');
    console.log('Success:', res);
  } catch (e) {
    console.error('Error:', e);
  }
}

main().catch(console.error);
