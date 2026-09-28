import { Router } from 'express';
import { CustomerDriverController } from './controllers/CustomerDriverController.js';
import { requireRole } from '../../common/middleware/requireRole.js';
import { createAuthenticateJwtMiddleware } from '../../common/middleware/authenticateJwt.js';
import { ITokenService } from '../auth/interfaces/ITokenService.js';
import { ApiRoutes } from '../../common/constants/ApiRoutes.js';
// We validate the query inside the controller, so we don't need body validation middleware here

export const createCustomerDriverRouter = (
  controller: CustomerDriverController,
  tokenService: ITokenService
): Router => {
  const router = Router();
  const authMiddleware = createAuthenticateJwtMiddleware(tokenService);
  const customerOnly = requireRole('CUSTOMER');

  router.use(authMiddleware, customerOnly);

  router.get(ApiRoutes.CUSTOMER.NEARBY_DRIVERS, controller.getNearbyDrivers);
  router.get(ApiRoutes.CUSTOMER.DRIVER_BY_ID, controller.getDriverDetails);

  return router;
};
