import { Request, Response, NextFunction } from 'express';
import { ITripService } from '../interfaces/ITripService.js';
import { HttpStatusCodes } from '../../../common/constants/HttpStatusCodes.js';
import { ApiResponseBuilder } from '../../../common/utils/ApiResponse.js';
import { AppError } from '../../../common/errors/AppError.js';
import { PrismaClient } from '@prisma/client';

export class CustomerTripController {
  constructor(
    private readonly _tripService: ITripService,
    private readonly _prisma: PrismaClient
  ) {}

  private async _getCustomerProfileId(userId: string): Promise<string> {
    const profile = await this._prisma.customerProfile.findUnique({ where: { userId } });
    if (!profile) throw new AppError('Customer profile not found', HttpStatusCodes.NOT_FOUND, 'PROFILE_NOT_FOUND');
    return profile.id;
  }

  calculatePrice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const breakdown = await this._tripService.calculatePrice(req.body);
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(breakdown, 'Price calculated successfully'));
    } catch (error) {
      next(error);
    }
  };

  createTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerProfileId = await this._getCustomerProfileId(req.user!.userId);
      const trip = await this._tripService.requestTrip(customerProfileId, req.body);
      res.status(HttpStatusCodes.CREATED).json(ApiResponseBuilder.success(trip, 'Trip requested successfully'));
    } catch (error) {
      next(error);
    }
  };

  getTrips = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerProfileId = await this._getCustomerProfileId(req.user!.userId);
      const trips = await this._tripService.getCustomerTrips(customerProfileId);
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(trips, 'Trips retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  getTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const trip = await this._tripService.getTripDetails(req.params.tripId as string);
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(trip, 'Trip details retrieved'));
    } catch (error) {
      next(error);
    }
  };

  cancelTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerProfileId = await this._getCustomerProfileId(req.user!.userId);
      const tripId = req.params.tripId as string;
      const { reason } = req.body;

      // Ensure the trip exists and belongs to this customer
      const trip = await this._prisma.trip.findUnique({
        where: { id: tripId },
        include: { driver: { include: { user: true } } }
      });

      if (!trip || trip.customerId !== customerProfileId) {
        throw new AppError('Trip not found or unauthorized', HttpStatusCodes.NOT_FOUND, 'TRIP_NOT_FOUND');
      }

      if (trip.status !== 'PENDING_DRIVER_RESPONSE' && trip.status !== 'ACCEPTED') {
        throw new AppError('Cannot cancel trip at this stage', HttpStatusCodes.BAD_REQUEST, 'INVALID_STATUS');
      }

      const updatedTrip = await this._prisma.trip.update({
        where: { id: tripId },
        data: { status: 'CANCELED' }
      });

      // Notify the driver
      const { SocketServer } = await import('../../realtime/SocketServer.js');
      SocketServer.emitToUser(trip.driver.userId, 'trip_canceled', {
        tripId,
        reason: reason || 'Customer canceled the request'
      });

      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(updatedTrip, 'Trip canceled successfully'));
    } catch (error) {
      next(error);
    }
  };
}
