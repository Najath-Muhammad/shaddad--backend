import { Request, Response, NextFunction } from 'express';
import { IDriverService } from '../interfaces/IDriverService.js';
import { ApiResponseBuilder } from '../../../common/utils/ApiResponse.js';
import { HttpStatusCodes } from '../../../common/constants/HttpStatusCodes.js';
import { ResponseMessages } from '../../../common/constants/ResponseMessages.js';
import { NearbyDriversQuerySchema } from '../dtos/NearbyDriversQueryDTO.js';

export class CustomerDriverController {
  constructor(private readonly _driverService: IDriverService) {}

  getNearbyDrivers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate query string
      const query = NearbyDriversQuerySchema.parse(req.query);
      const drivers = await this._driverService.getNearbyDrivers(query);
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(drivers, ResponseMessages.NEARBY_DRIVERS_RETRIEVED));
    } catch (error) {
      next(error);
    }
  };

  getDriverDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const driverProfileId = req.params.driverProfileId as string;
      const driver = await this._driverService.getPublicDriverDetails(driverProfileId);
      res.status(HttpStatusCodes.OK).json(ApiResponseBuilder.success(driver, ResponseMessages.DRIVER_DETAILS_RETRIEVED));
    } catch (error) {
      next(error);
    }
  };
}
