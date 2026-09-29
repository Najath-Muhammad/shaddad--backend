import { Trip, TripStatus } from '@prisma/client';
import { ITripService } from '../interfaces/ITripService.js';
import { ITripRepository } from '../interfaces/ITripRepository.js';
import { IPricingService, PricingBreakdownDTO } from '../../pricing/interfaces/IPricingService.js';
import { CreateTripRequestDTO, CalculatePriceDTO } from '../dtos/CreateTripDTO.js';
import { AppError } from '../../../common/errors/AppError.js';
import { HttpStatusCodes } from '../../../common/constants/HttpStatusCodes.js';
import { IDriverRepository } from '../../driver/interfaces/IDriverRepository.js';

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const distance = R * c;
  return distance;
}

export class TripService implements ITripService {
  constructor(
    private readonly _tripRepository: ITripRepository,
    private readonly _pricingService: IPricingService,
    private readonly _driverRepository: IDriverRepository
  ) {}

  async calculatePrice(data: CalculatePriceDTO): Promise<{ distanceKm: number; pricing: PricingBreakdownDTO; }> {
    const distanceKm = calculateHaversineDistance(
      data.pickupLatitude,
      data.pickupLongitude,
      data.destinationLatitude,
      data.destinationLongitude
    );

    const pricing = await this._pricingService.calculatePrice(data.vehicleType, distanceKm, data.weightKg);

    return {
      distanceKm: Number(distanceKm.toFixed(2)),
      pricing
    };
  }

  async requestTrip(userId: string, data: CreateTripRequestDTO): Promise<Trip> {
    // We need the customer's profile ID
    // Note: To simplify injection dependencies, we assume `userId` is enough to find customer profile, 
    // or we need CustomerRepository. For Phase 3, we'll fetch the driver profile to get the vehicle type.
    const driver = await this._driverRepository.findProfileById(data.driverProfileId);
    if (!driver || !driver.vehicle) {
      throw new AppError('Selected driver or vehicle not found', HttpStatusCodes.NOT_FOUND, 'DRIVER_NOT_FOUND');
    }

    if (driver.availability !== 'ONLINE' || driver.verificationStatus !== 'APPROVED') {
      throw new AppError('Selected driver is no longer available', HttpStatusCodes.BAD_REQUEST, 'DRIVER_UNAVAILABLE');
    }

    const priceCalc = await this.calculatePrice({
      pickupLatitude: data.pickupLatitude,
      pickupLongitude: data.pickupLongitude,
      destinationLatitude: data.destinationLatitude,
      destinationLongitude: data.destinationLongitude,
      weightKg: data.weightKg,
      vehicleType: driver.vehicle.vehicleType
    });

    // We assume the controller passes the actual CustomerProfile ID as `userId`.
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration
    
    return this._tripRepository.createTrip(
      userId, 
      data, 
      priceCalc.distanceKm, 
      priceCalc.pricing, 
      expiresAt
    );
  }

  async getTripDetails(tripId: string): Promise<Trip> {
    const trip = await this._tripRepository.getTripById(tripId);
    if (!trip) {
      throw new AppError('Trip not found', HttpStatusCodes.NOT_FOUND, 'TRIP_NOT_FOUND');
    }
    return trip;
  }

  async getIncomingRequests(driverProfileId: string): Promise<Trip[]> {
    return this._tripRepository.getPendingTripsForDriver(driverProfileId);
  }

  async respondToTrip(driverProfileId: string, tripId: string, accept: boolean, reason?: string): Promise<Trip> {
    const trip = await this._tripRepository.getTripById(tripId);
    if (!trip) {
      throw new AppError('Trip not found', HttpStatusCodes.NOT_FOUND, 'TRIP_NOT_FOUND');
    }

    if (trip.driverId !== driverProfileId) {
      throw new AppError('Unauthorized', HttpStatusCodes.FORBIDDEN, 'FORBIDDEN');
    }

    if (trip.status !== TripStatus.PENDING_DRIVER_RESPONSE) {
      throw new AppError(`Trip is already ${trip.status}`, HttpStatusCodes.BAD_REQUEST, 'INVALID_STATE');
    }

    const newStatus = accept ? TripStatus.ACCEPTED : TripStatus.REJECTED;
    
    return this._tripRepository.updateTripStatus(tripId, newStatus, driverProfileId, reason || (accept ? 'Driver accepted' : 'Driver rejected'));
  }

  async getCustomerTrips(customerProfileId: string): Promise<Trip[]> {
    return this._tripRepository.getCustomerTrips(customerProfileId);
  }

  async getDriverTrips(driverProfileId: string): Promise<Trip[]> {
    return this._tripRepository.getDriverTrips(driverProfileId);
  }

  // --- PHASE 4 STATE MACHINE ---
  async updateTripState(profileId: string, userRole: string, tripId: string, newState: string): Promise<Trip> {
    const trip = await this.getTripDetails(tripId);

    if (userRole === 'DRIVER' && trip.driverId !== profileId) {
      throw new AppError('Unauthorized', HttpStatusCodes.FORBIDDEN);
    }
    if (userRole === 'CUSTOMER' && trip.customerId !== profileId) {
      throw new AppError('Unauthorized', HttpStatusCodes.FORBIDDEN);
    }

    const currentState = trip.status;
    const validTransitions: Record<string, string[]> = {
      CONFIRMED: ['GOING_TO_PICKUP'],
      GOING_TO_PICKUP: ['DRIVER_ARRIVED'],
      DRIVER_ARRIVED: ['CARGO_PICKED_UP'],
      CARGO_PICKED_UP: ['IN_TRANSIT'],
      IN_TRANSIT: ['ARRIVED_AT_DESTINATION'],
      ARRIVED_AT_DESTINATION: ['DELIVERED'] // DELIVERED requires OTP which has its own method
    };

    if (!validTransitions[currentState] || !validTransitions[currentState].includes(newState)) {
      throw new AppError(`Invalid state transition from ${currentState} to ${newState}`, HttpStatusCodes.BAD_REQUEST);
    }

    const updatedTrip = await this._tripRepository.updateTripStatus(tripId, newState as any, profileId, 'User triggered transition');
    return updatedTrip;
  }

  async confirmTestPayment(customerProfileId: string, tripId: string): Promise<Trip> {
    const trip = await this.getTripDetails(tripId);
    
    if (trip.customerId !== customerProfileId) {
      throw new AppError('Unauthorized', HttpStatusCodes.FORBIDDEN);
    }

    if (trip.status !== 'ACCEPTED') {
      throw new AppError('Trip must be ACCEPTED to process payment', HttpStatusCodes.BAD_REQUEST);
    }

    // Simulate PAYMENT_PENDING -> CONFIRMED
    await this._tripRepository.updateTripStatus(tripId, 'PAYMENT_PENDING' as any, customerProfileId, 'Test Payment initiated');
    
    // Generate Delivery OTP
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Update to confirmed
    const updatedTrip = await this._tripRepository.updateTripStatusAndOtp(tripId, 'CONFIRMED' as any, deliveryOtp, customerProfileId, 'Test Payment successful');
    return updatedTrip;
  }

  async submitProofOfDelivery(driverProfileId: string, tripId: string, otp: string, _photoUrl?: string): Promise<Trip> {
    const trip = await this.getTripDetails(tripId);
    
    if (trip.driverId !== driverProfileId) {
      throw new AppError('Unauthorized', HttpStatusCodes.FORBIDDEN);
    }

    if (trip.status !== 'ARRIVED_AT_DESTINATION') {
      throw new AppError('Trip must be ARRIVED_AT_DESTINATION to submit proof', HttpStatusCodes.BAD_REQUEST);
    }

    if (trip.deliveryOtp !== otp) {
      throw new AppError('Invalid Delivery OTP', HttpStatusCodes.BAD_REQUEST);
    }

    // Update to DELIVERED
    let updatedTrip = await this._tripRepository.updateTripStatus(tripId, 'DELIVERED' as any, driverProfileId, 'Valid OTP provided');

    // Auto-complete
    updatedTrip = await this._tripRepository.updateTripStatus(tripId, 'COMPLETED' as any, driverProfileId, 'Trip completed successfully');

    return updatedTrip;
  }
}
