import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponseBuilder } from '../../../common/utils/ApiResponse.js';
import { HttpStatusCodes } from '../../../common/constants/HttpStatusCodes.js';

export class AdminDashboardController {
  constructor(private readonly _prisma: PrismaClient) {}

  getMetrics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [
        totalCustomers,
        totalDrivers,
        pendingVerifications,
        activeTrips,
        completedTrips,
        cancelledTrips,
        paymentsRes,
        pendingPayouts,
        openDisputes
      ] = await Promise.all([
        this._prisma.customerProfile.count(),
        this._prisma.driverProfile.count({ where: { verificationStatus: 'APPROVED' } }),
        this._prisma.driverProfile.count({ where: { verificationStatus: 'PENDING_VERIFICATION' } }),
        this._prisma.trip.count({ 
          where: { 
            status: { in: ['ACCEPTED', 'GOING_TO_PICKUP', 'DRIVER_ARRIVED', 'CARGO_PICKED_UP', 'IN_TRANSIT', 'ARRIVED_AT_DESTINATION'] }
          }
        }),
        this._prisma.trip.count({ where: { status: 'COMPLETED' } }),
        this._prisma.trip.count({ where: { status: { in: ['REJECTED', 'EXPIRED'] } } }),
        this._prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
        this._prisma.payout.count({ where: { status: { in: ['PENDING', 'ELIGIBLE', 'PROCESSING'] } } }),
        this._prisma.dispute.count({ where: { status: 'OPEN' } })
      ]);

      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success({
        totalCustomers,
        totalDrivers,
        pendingVerifications,
        activeTrips,
        completedTrips,
        cancelledTrips,
        totalPayments: paymentsRes._sum.amount || 0,
        pendingPayouts,
        openDisputes
      }, 'Metrics retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };
}
