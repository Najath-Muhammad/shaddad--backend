import { Request, Response, NextFunction } from 'express';
import { ITripService } from '../interfaces/ITripService.js';
import { HttpStatusCodes } from '../../../common/constants/HttpStatusCodes.js';
import { ApiResponseBuilder } from '../../../common/utils/ApiResponse.js';
import { AppError } from '../../../common/errors/AppError.js';
import { PrismaClient } from '@prisma/client';

export class DriverTripController {
  constructor(
    private readonly _tripService: ITripService,
    private readonly _prisma: PrismaClient
  ) {}

  private async _getDriverProfileId(userId: string): Promise<string> {
    const profile = await this._prisma.driverProfile.findUnique({ where: { userId } });
    if (!profile) throw new AppError('Driver profile not found', HttpStatusCodes.NOT_FOUND, 'PROFILE_NOT_FOUND');
    return profile.id;
  }

  getIncomingRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const driverProfileId = await this._getDriverProfileId(req.user!.userId);
      const requests = await this._tripService.getIncomingRequests(driverProfileId);
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(requests, 'Incoming requests retrieved'));
    } catch (error) {
      next(error);
    }
  };

  respondToTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const driverProfileId = await this._getDriverProfileId(req.user!.userId);
      const tripId = req.params.tripId as string;
      const { accept, reason } = req.body;
      const trip = await this._tripService.respondToTrip(driverProfileId, tripId, accept, reason);
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(trip, 'Trip response recorded'));
    } catch (error) {
      next(error);
    }
  };
}
