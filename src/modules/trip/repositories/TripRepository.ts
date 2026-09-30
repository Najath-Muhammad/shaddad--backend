import { PrismaClient, Trip, TripStatus } from '@prisma/client';
import { ITripRepository } from '../interfaces/ITripRepository.js';
import { CreateTripRequestDTO } from '../dtos/CreateTripDTO.js';
import { PricingBreakdownDTO } from '../../pricing/interfaces/IPricingService.js';

export class TripRepository implements ITripRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async createTrip(
    customerId: string, 
    data: CreateTripRequestDTO, 
    distanceKm: number, 
    pricing: PricingBreakdownDTO, 
    expiresAt: Date
  ): Promise<Trip> {
    return this._prisma.trip.create({
      data: {
        customerId,
        driverId: data.driverProfileId,
        pickupLatitude: data.pickupLatitude,
        pickupLongitude: data.pickupLongitude,
        pickupAddress: data.pickupAddress,
        destinationLatitude: data.destinationLatitude,
        destinationLongitude: data.destinationLongitude,
        destinationAddress: data.destinationAddress,
        distanceKm,
        pickupDateTime: new Date(data.pickupDateTime),
        cargoType: data.cargoType,
        weightKg: data.weightKg,
        quantity: data.quantity,
        additionalRequirements: data.additionalRequirements,
        
        baseFare: pricing.baseFare,
        distanceCharge: pricing.distanceCharge,
        vehicleCharge: pricing.vehicleCharge,
        weightCharge: pricing.weightCharge,
        subtotal: pricing.subtotal,
        commission: pricing.commission,
        driverEarnings: pricing.driverEarnings,
        totalPrice: pricing.totalPrice,

        expiresAt,
        status: TripStatus.PENDING_DRIVER_RESPONSE,

        statusHistory: {
          create: {
            status: TripStatus.PENDING_DRIVER_RESPONSE,
            changedById: customerId,
            reason: 'Trip created by customer'
          }
        }
      }
    });
  }

  async getTripById(tripId: string): Promise<Trip | null> {
    return this._prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        customer: { include: { user: true } },
        driver: { include: { user: true, vehicle: true } }
      }
    });
  }

  async updateTripStatus(tripId: string, status: TripStatus, changedById: string | null, reason?: string): Promise<Trip> {
    return this._prisma.trip.update({
      where: { id: tripId },
      data: {
        status,
        statusHistory: {
          create: {
            status,
            changedById,
            reason
          }
        }
      },
      include: {
        customer: { include: { user: true } },
        driver: { include: { user: true, vehicle: true } }
      }
    });
  }

  async updateTripStatusAndOtp(tripId: string, status: TripStatus, otp: string, changedById: string | null, reason?: string): Promise<Trip> {
    return this._prisma.trip.update({
      where: { id: tripId },
      data: {
        status,
        deliveryOtp: otp,
        statusHistory: {
          create: {
            status,
            changedById,
            reason
          }
        }
      },
      include: {
        customer: { include: { user: true } },
        driver: { include: { user: true, vehicle: true } }
      }
    });
  }

  async getPendingTripsForDriver(driverProfileId: string): Promise<Trip[]> {
    return this._prisma.trip.findMany({
      where: {
        driverId: driverProfileId,
        status: TripStatus.PENDING_DRIVER_RESPONSE
      },
      include: {
        customer: { include: { user: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCustomerTrips(customerId: string): Promise<Trip[]> {
    return this._prisma.trip.findMany({
      where: { customerId },
      include: {
        driver: { include: { user: true, vehicle: true } },
        reviews: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getDriverTrips(driverProfileId: string): Promise<Trip[]> {
    return this._prisma.trip.findMany({
      where: { driverId: driverProfileId },
      include: {
        customer: { include: { user: true } },
        reviews: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async expirePendingTrips(currentTime: Date): Promise<number> {
    const expiredTrips = await this._prisma.trip.findMany({
      where: {
        status: TripStatus.PENDING_DRIVER_RESPONSE,
        expiresAt: { lt: currentTime }
      }
    });

    if (expiredTrips.length === 0) return 0;

    const ids = expiredTrips.map(t => t.id);

    await this._prisma.$transaction(async (tx) => {
      await tx.trip.updateMany({
        where: { id: { in: ids } },
        data: { status: TripStatus.EXPIRED }
      });

      await tx.tripStatusHistory.createMany({
        data: ids.map(tripId => ({
          tripId,
          status: TripStatus.EXPIRED,
          reason: 'Auto-expired due to no driver response',
        }))
      });
    });

    return ids.length;
  }
}
