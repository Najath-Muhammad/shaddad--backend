import { Router } from 'express';
import { AdminDriverController } from './controllers/AdminDriverController.js';
import { requireRole } from '../../common/middleware/requireRole.js';
import { createAuthenticateJwtMiddleware } from '../../common/middleware/authenticateJwt.js';
import { validateRequest } from '../../common/middleware/validateRequest.js';
import { ITokenService } from '../auth/interfaces/ITokenService.js';
import { ApiRoutes } from '../../common/constants/ApiRoutes.js';
import { VerifyDriverSchema } from './dtos/VerifyDriverDTO.js';

export const createAdminDriverRouter = (
  controller: AdminDriverController,
  tokenService: ITokenService
): Router => {
  const router = Router();
  const authMiddleware = createAuthenticateJwtMiddleware(tokenService);
  const adminOnly = requireRole('ADMIN');

  router.use(authMiddleware, adminOnly);

  router.get(ApiRoutes.ADMIN.DRIVERS_PENDING, controller.getPendingDrivers);
  router.get(ApiRoutes.ADMIN.DRIVER_BY_ID, controller.getDriverDossier);
  
  router.post(
    ApiRoutes.ADMIN.DRIVER_VERIFY,
    validateRequest(VerifyDriverSchema),
    controller.verifyDriver
  );

  return router;
};
