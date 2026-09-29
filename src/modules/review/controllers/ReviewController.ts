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

      const profile = await this._prisma.customerProfile.findUnique({ where: { userId } });
      if (!profile) {
        res.status(HttpStatusCodes.NOT_FOUND).json(ApiResponseBuilder.error('NOT_FOUND', 'Customer profile not found'));
        return;
      }

      const trip = await this._prisma.trip.findUnique({ where: { id: tripId } });
      if (!trip || trip.customerId !== profile.id) {
        res.status(HttpStatusCodes.FORBIDDEN).json(ApiResponseBuilder.error('FORBIDDEN', 'Trip not found or unauthorized'));
        return;
      }

      if (trip.status !== 'COMPLETED') {
        res.status(HttpStatusCodes.BAD_REQUEST).json(ApiResponseBuilder.error('BAD_REQUEST', 'Can only review completed trips'));
        return;
      }

      // Check if review already exists
      const existing = await this._prisma.review.findUnique({ where: { tripId } });
      if (existing) {
        res.status(HttpStatusCodes.BAD_REQUEST).json(ApiResponseBuilder.error('BAD_REQUEST', 'Review already exists'));
        return;
      }

      // Create review
      const review = await this._prisma.review.create({
        data: {
          tripId,
          customerId: profile.id,
          driverId: trip.driverId,
          rating,
          comment
        }
      });

      // Update driver average rating
      const allReviews = await this._prisma.review.findMany({ where: { driverId: trip.driverId } });
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      await this._prisma.driverProfile.update({
        where: { id: trip.driverId },
        data: { rating: avg }
      });

      res.status(HttpStatusCodes.CREATED).json(ApiResponseBuilder.success(review, 'Review submitted successfully'));
    } catch (error) {
      next(error);
    }
  };
}
