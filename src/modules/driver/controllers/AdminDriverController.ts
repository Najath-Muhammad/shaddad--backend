import { Request, Response, NextFunction } from 'express';
import { IDriverService } from '../interfaces/IDriverService.js';
import { ApiResponseBuilder } from '../../../common/utils/ApiResponse.js';
import { HttpStatusCodes } from '../../../common/constants/HttpStatusCodes.js';
import { ResponseMessages } from '../../../common/constants/ResponseMessages.js';

export class AdminDriverController {
  constructor(private readonly _driverService: IDriverService) {}

  getPendingDrivers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profiles = await this._driverService.getPendingDrivers();
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(profiles, ResponseMessages.ADMIN_DRIVERS_LIST_RETRIEVED));
    } catch (error) {
      next(error);
    }
  };

  getDriverDossier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const driverProfileId = req.params.driverProfileId as string;
      const profile = await this._driverService.getDriverDossier(driverProfileId);
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(profile, ResponseMessages.ADMIN_DRIVER_DOSSIER_RETRIEVED));
    } catch (error) {
      next(error);
    }
  };

  verifyDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const driverProfileId = req.params.driverProfileId as string;
      const adminId = req.user!.userId;
      const profile = await this._driverService.verifyDriver(driverProfileId, adminId, req.body);
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(profile, ResponseMessages.DRIVER_VERIFIED));
    } catch (error) {
      next(error);
    }
  };
}
