
import { IPaymentService } from '../interfaces/IPaymentService.js';
import { IPaymentProvider } from '../interfaces/IPaymentProvider.js';
import { IPaymentRepository } from '../interfaces/IPaymentRepository.js';
import { ITripRepository } from '../../trip/interfaces/ITripRepository.js';
import { AppError } from '../../../common/errors/AppError.js';
import { HttpStatusCodes } from '../../../common/constants/HttpStatusCodes.js';
import { SocketServer } from '../../realtime/SocketServer.js';

export class PaymentService implements IPaymentService {
  constructor(
    private readonly _paymentProvider: IPaymentProvider,
    private readonly _paymentRepository: IPaymentRepository,
    private readonly _tripRepository: ITripRepository,
    private readonly _notificationService: any
  ) {}

  async initiatePayment(customerId: string, tripId: string) {
    const trip = await this._tripRepository.getTripById(tripId);
    if (!trip) throw new AppError('Trip not found', HttpStatusCodes.NOT_FOUND);

    if (trip.customerId !== customerId) {
      throw new AppError('Unauthorized', HttpStatusCodes.FORBIDDEN);
    }

    if (trip.status !== 'ACCEPTED' && trip.status !== 'PAYMENT_PENDING') {
      throw new AppError(`Trip must be in ACCEPTED state to pay (current: ${trip.status})`, HttpStatusCodes.BAD_REQUEST);
    }

    // Instead of returning a dummy secret on retry, we just generate a new PaymentIntent 
    // from Stripe so the client gets a fresh, real client_secret every time they hit "Pay Now".
    
    const { clientSecret, paymentId } = await this._paymentProvider.initiatePayment(
      trip.id,
      Number(trip.totalPrice),
      'SAR'
    );

    // createPayment in repository uses upsert, so it safely updates existing pending payments
    const payment = await this._paymentRepository.createPayment({
      tripId: trip.id,
      amount: Number(trip.totalPrice),
      currency: 'SAR',
      gateway: 'STRIPE',
      gatewayPaymentId: paymentId
    });

    // Mark trip as PAYMENT_PENDING
    if (trip.status !== 'PAYMENT_PENDING') {
      await this._tripRepository.updateTripStatus(tripId, 'PAYMENT_PENDING' as any, customerId, 'Payment intent created');
    }

    return { clientSecret, payment };
  }

  async handleWebhook(rawBody: string | Buffer, signature: string): Promise<void> {
    const verification = this._paymentProvider.verifyWebhook(rawBody, signature);
    if (!verification.isValid || !verification.event) {
      throw new AppError(`Invalid webhook signature: ${verification.error}`, HttpStatusCodes.BAD_REQUEST);
    }

    const event = verification.event;
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const paymentId = paymentIntent.id;

      const payment = await this._paymentRepository.getPaymentByGatewayId(paymentId);
      if (!payment) return; // Not our payment

      if (payment.status === 'PAID') return; // Idempotent

      await this._paymentRepository.updatePaymentStatus(paymentId, 'PAID' as any, paymentIntent);

      // Generate Delivery OTP
      const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

      // Update Trip to CONFIRMED
      const trip = await this._tripRepository.updateTripStatusAndOtp(
        payment.tripId,
        'CONFIRMED' as any,
        deliveryOtp,
        'SYSTEM',
        'Payment successful'
      );

      // Notify Driver
      if (this._notificationService && trip) {
        const fullTrip = await this._tripRepository.getTripById(payment.tripId);
        if (fullTrip && fullTrip.driverId) {
           // Assume we have driver repository injected, but we don't, so let's just emit to the trip room!
           SocketServer.emitToTrip(payment.tripId, 'notification', {
             title: 'Trip Confirmed!',
             body: 'The customer has completed the payment. Please head to the pickup location.'
           });
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const paymentId = paymentIntent.id;

      const payment = await this._paymentRepository.getPaymentByGatewayId(paymentId);
      if (!payment) return;

      await this._paymentRepository.updatePaymentStatus(paymentId, 'FAILED' as any, paymentIntent);
      
      // Update Trip back to ACCEPTED or PAYMENT_FAILED (if we had it)
      await this._tripRepository.updateTripStatus(
        payment.tripId,
        'ACCEPTED' as any, // Revert to ACCEPTED so they can try again
        'SYSTEM',
        'Payment failed'
      );
    }
  }
}
