import { Trip, TripStatus } from '@prisma/client';
import { CreateTripRequestDTO } from '../dtos/CreateTripDTO.js';
import { PricingBreakdownDTO } from '../../pricing/interfaces/IPricingService.js';

export interface ITripRepository {
  createTrip(
    customerId: string,
    data: CreateTripRequestDTO,
    distanceKm: number,
    pricing: PricingBreakdownDTO,
    expiresAt: Date
  ): Promise<Trip>;
  
  getTripById(tripId: string): Promise<Trip | null>;
  
  updateTripStatus(
    tripId: string, 
    status: TripStatus, 
    changedById: string | null, 
    reason?: string
  ): Promise<Trip>;

  updateTripStatusAndOtp(
    tripId: string, 
    status: TripStatus, 
    otp: string, 
    changedById: string | null, 
    reason?: string
  ): Promise<Trip>;

  getPendingTripsForDriver(driverProfileId: string): Promise<Trip[]>;
  getDriverTrips(driverProfileId: string): Promise<Trip[]>;
  getCustomerTrips(customerId: string): Promise<Trip[]>;

  expirePendingTrips(currentTime: Date): Promise<number>;
}
