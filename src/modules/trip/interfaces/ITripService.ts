import { Trip } from '@prisma/client';
import { CreateTripRequestDTO, CalculatePriceDTO } from '../dtos/CreateTripDTO.js';
import { PricingBreakdownDTO } from '../../pricing/interfaces/IPricingService.js';

export interface ITripService {
  calculatePrice(data: CalculatePriceDTO): Promise<{ distanceKm: number, pricing: PricingBreakdownDTO }>;
  requestTrip(userId: string, data: CreateTripRequestDTO): Promise<Trip>;
  getTripDetails(tripId: string): Promise<Trip>;
  
  // Driver Actions
  getIncomingRequests(driverUserId: string): Promise<Trip[]>;
  getDriverTrips(driverUserId: string): Promise<Trip[]>;
  respondToTrip(driverUserId: string, tripId: string, accept: boolean, reason?: string): Promise<Trip>;
  
  // Customer Actions
  getCustomerTrips(customerId: string): Promise<Trip[]>;
  updateTripState(profileId: string, userRole: string, tripId: string, newState: string): Promise<Trip>;
  submitProofOfDelivery(driverProfileId: string, tripId: string, otp: string, photoUrl?: string): Promise<Trip>;
}
