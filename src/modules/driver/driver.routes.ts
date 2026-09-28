import { Router } from 'express';
import { DriverController } from './controllers/DriverController.js';
import { requireRole } from '../../common/middleware/requireRole.js';
import { createAuthenticateJwtMiddleware } from '../../common/middleware/authenticateJwt.js';
import { validateRequest } from '../../common/middleware/validateRequest.js';
import { ITokenService } from '../auth/interfaces/ITokenService.js';
import { ApiRoutes } from '../../common/constants/ApiRoutes.js';
import { uploadMiddleware } from '../../common/middleware/uploadMiddleware.js';
import { CreateVehicleSchema } from './dtos/CreateVehicleDTO.js';
import { UpdateVehicleSchema } from './dtos/UpdateVehicleDTO.js';
import { UpdateAvailabilitySchema } from './dtos/UpdateAvailabilityDTO.js';
import { UpdateLocationSchema } from './dtos/UpdateLocationDTO.js';

export const createDriverRouter = (
  controller: DriverController,
  tokenService: ITokenService
): Router => {
  const router = Router();
  const authMiddleware = createAuthenticateJwtMiddleware(tokenService);
  const driverOnly = requireRole('DRIVER');

  router.use(authMiddleware, driverOnly);

  router.get(ApiRoutes.DRIVER.PROFILE, controller.getProfile);
  
  router.post(
    ApiRoutes.DRIVER.DOCUMENTS,
    uploadMiddleware.any(),
    controller.uploadDocuments
  );

  router.get(ApiRoutes.DRIVER.VEHICLE, controller.getVehicle);
  router.post(
    ApiRoutes.DRIVER.VEHICLE,
    validateRequest(CreateVehicleSchema),
    controller.createVehicle
  );
  router.put(
    ApiRoutes.DRIVER.VEHICLE,
    validateRequest(UpdateVehicleSchema),
    controller.updateVehicle
  );

  router.post(
    ApiRoutes.DRIVER.AVAILABILITY,
    validateRequest(UpdateAvailabilitySchema),
    controller.updateAvailability
  );

  router.post(
    ApiRoutes.DRIVER.LOCATION,
    validateRequest(UpdateLocationSchema),
    controller.updateLocation
  );

  return router;
};
