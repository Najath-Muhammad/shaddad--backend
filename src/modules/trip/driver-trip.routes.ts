import { Router } from 'express';
import { DriverTripController } from './controllers/DriverTripController.js';
import { requireRole } from '../../common/middleware/requireRole.js';
import { createAuthenticateJwtMiddleware } from '../../common/middleware/authenticateJwt.js';
import { validateRequest } from '../../common/middleware/validateRequest.js';
import { ITokenService } from '../auth/interfaces/ITokenService.js';
import { RespondToTripSchema } from './dtos/RespondToTripDTO.js';

export const createDriverTripRouter = (
  controller: DriverTripController,
  tokenService: ITokenService
): Router => {
  const router = Router();
  const authMiddleware = createAuthenticateJwtMiddleware(tokenService);
  const driverOnly = requireRole('DRIVER');

  router.use(authMiddleware, driverOnly);

  router.get('/incoming', controller.getIncomingRequests);
  router.post('/:tripId/respond', validateRequest(RespondToTripSchema), controller.respondToTrip);

  return router;
};
