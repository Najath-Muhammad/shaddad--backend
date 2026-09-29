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
}
