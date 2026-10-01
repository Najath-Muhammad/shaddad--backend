import { SocketServer } from '../../realtime/SocketServer.js';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponseBuilder } from '../../../common/utils/ApiResponse.js';
import { HttpStatusCodes } from '../../../common/constants/HttpStatusCodes.js';

export class AdminEntityController {
  constructor(private readonly _prisma: PrismaClient) {}

  getAllCustomers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customers = await this._prisma.customerProfile.findMany({
        include: { user: { select: { id: true, fullName: true, phoneNumber: true, email: true, isActive: true, createdAt: true } } },
        orderBy: { createdAt: 'desc' }
      });
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(customers, 'Customers retrieved'));
    } catch (error) {
      next(error);
    }
  };

  getAllDrivers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const drivers = await this._prisma.driverProfile.findMany({
        include: { 
          user: { select: { id: true, fullName: true, phoneNumber: true, email: true, isActive: true, createdAt: true } },
          vehicle: true
        },
        orderBy: { createdAt: 'desc' }
      });
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(drivers, 'Drivers retrieved'));
    } catch (error) {
      next(error);
    }
  };

  getAllTrips = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const trips = await this._prisma.trip.findMany({
        include: {
          customer: { include: { user: { select: { fullName: true, phoneNumber: true } } } },
          driver: { include: { user: { select: { fullName: true, phoneNumber: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(trips, 'Trips retrieved'));
    } catch (error) {
      next(error);
    }
  };

  toggleUserBlock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;
      const { reason } = req.body;
      
      const user = await this._prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        res.status(HttpStatusCodes.NOT_FOUND).json(ApiResponseBuilder.error('NOT_FOUND', 'User not found'));
        return;
      }

      const willBeActive = !user.isActive;

      const updated = await this._prisma.user.update({
        where: { id: userId },
        data: { 
          isActive: willBeActive,
          blockReason: willBeActive ? null : (reason || 'No reason provided')
        }
      });

      if (!willBeActive) {
        // Emit event to the blocked user to force logout on mobile
        SocketServer.emitToUser(userId, 'user_blocked', {
          reason: updated.blockReason
        });
      }

      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(
        { isActive: updated.isActive, blockReason: updated.blockReason }, 
        `User ${updated.isActive ? 'unblocked' : 'blocked'} successfully`
      ));
    } catch (error) {
      next(error);
    }
  };

  getDriverRatingHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const driverId = req.params.driverProfileId as string;
      const reviews = await this._prisma.review.findMany({
        where: { driverId, reviewerRole: 'CUSTOMER' },
        include: { trip: { select: { createdAt: true } } },
        orderBy: { createdAt: 'desc' }
      });
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(reviews, 'Driver rating history retrieved'));
    } catch (error) {
      next(error);
    }
  };
}
