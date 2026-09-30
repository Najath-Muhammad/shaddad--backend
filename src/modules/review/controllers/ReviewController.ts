import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { HttpStatusCodes } from '../../../common/constants/HttpStatusCodes.js';
import { ApiResponseBuilder } from '../../../common/utils/ApiResponse.js';

export class ReviewController {
  constructor(private readonly _prisma: PrismaClient) {}

  submitReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rating, comment } = req.body;
      const tripId = req.params.tripId as string;
      const userId = req.user!.userId;
      const userRole = req.user!.role; // 'CUSTOMER' or 'DRIVER'

      const trip = await this._prisma.trip.findUnique({ where: { id: tripId } });
      if (!trip) {
        res.status(HttpStatusCodes.NOT_FOUND).json(ApiResponseBuilder.error('NOT_FOUND', 'Trip not found'));
        return;
      }

      if (trip.status !== 'COMPLETED') {
        res.status(HttpStatusCodes.BAD_REQUEST).json(ApiResponseBuilder.error('BAD_REQUEST', 'Can only review completed trips'));
        return;
      }

      let reviewerRole = 'CUSTOMER';
      if (userRole === 'DRIVER') {
        const profile = await this._prisma.driverProfile.findUnique({ where: { userId } });
        if (!profile || trip.driverId !== profile.id) {
          res.status(HttpStatusCodes.FORBIDDEN).json(ApiResponseBuilder.error('FORBIDDEN', 'Unauthorized'));
          return;
        }
        reviewerRole = 'DRIVER';
      } else {
        const profile = await this._prisma.customerProfile.findUnique({ where: { userId } });
        if (!profile || trip.customerId !== profile.id) {
          res.status(HttpStatusCodes.FORBIDDEN).json(ApiResponseBuilder.error('FORBIDDEN', 'Unauthorized'));
          return;
        }
      }

      // Check if review already exists
      const existing = await this._prisma.review.findUnique({ 
        where: { tripId_reviewerRole: { tripId, reviewerRole } } 
      });
      if (existing) {
        res.status(HttpStatusCodes.BAD_REQUEST).json(ApiResponseBuilder.error('BAD_REQUEST', 'Review already exists'));
        return;
      }

      // Create review
      const review = await this._prisma.review.create({
        data: {
          tripId,
          customerId: trip.customerId,
          driverId: trip.driverId,
          reviewerRole,
          rating,
          comment
        }
      });

      // Update average rating
      if (reviewerRole === 'CUSTOMER') {
        // Customer reviewing Driver -> update DriverProfile
        const allReviews = await this._prisma.review.findMany({ where: { driverId: trip.driverId, reviewerRole: 'CUSTOMER' } });
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await this._prisma.driverProfile.update({
          where: { id: trip.driverId },
          data: { rating: avg }
        });
      } else {
        // Driver reviewing Customer -> update CustomerProfile
        const allReviews = await this._prisma.review.findMany({ where: { customerId: trip.customerId, reviewerRole: 'DRIVER' } });
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await this._prisma.customerProfile.update({
          where: { id: trip.customerId },
          data: { rating: avg }
        });
      }

      res.status(HttpStatusCodes.CREATED).json(ApiResponseBuilder.success(review, 'Review submitted successfully'));
    } catch (error) {
      next(error);
    }
  };
}
