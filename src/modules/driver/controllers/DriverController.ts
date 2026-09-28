import { Request, Response, NextFunction } from 'express';
import { IDriverService } from '../interfaces/IDriverService.js';
import { ApiResponseBuilder } from '../../../common/utils/ApiResponse.js';
import { HttpStatusCodes } from '../../../common/constants/HttpStatusCodes.js';
import { ResponseMessages } from '../../../common/constants/ResponseMessages.js';
import { AppError } from '../../../common/errors/AppError.js';

export class DriverController {
  constructor(private readonly _driverService: IDriverService) {}

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const profile = await this._driverService.getProfile(userId);
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(profile, ResponseMessages.DRIVER_PROFILE_RETRIEVED));
    } catch (error) {
      next(error);
    }
  };

  getVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const vehicle = await this._driverService.getVehicle(userId);
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(vehicle, ResponseMessages.VEHICLE_RETRIEVED));
    } catch (error) {
      next(error);
    }
  };

  createVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const vehicle = await this._driverService.createVehicle(userId, req.body);
      res.status(HttpStatusCodes.CREATED).json(ApiResponseBuilder.success(vehicle, ResponseMessages.VEHICLE_CREATED));
    } catch (error) {
      next(error);
    }
  };

  updateVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const vehicle = await this._driverService.updateVehicle(userId, req.body);
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(vehicle, ResponseMessages.VEHICLE_UPDATED));
    } catch (error) {
      next(error);
    }
  };

  uploadDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        throw new AppError('No files uploaded', HttpStatusCodes.BAD_REQUEST, 'VALIDATION_ERROR');
      }

      const profile = await this._driverService.uploadDocuments(userId, files);
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(profile, ResponseMessages.DOCUMENTS_UPLOADED));
    } catch (error) {
      next(error);
    }
  };

  updateAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      await this._driverService.updateAvailability(userId, req.body);
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(null, ResponseMessages.AVAILABILITY_UPDATED));
    } catch (error) {
      next(error);
    }
  };

  updateLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      await this._driverService.updateLocation(userId, req.body);
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(null, ResponseMessages.LOCATION_UPDATED));
    } catch (error) {
      next(error);
    }
  };
}
