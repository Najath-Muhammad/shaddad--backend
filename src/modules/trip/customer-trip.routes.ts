import { Router } from 'express';
import { CustomerTripController } from './controllers/CustomerTripController.js';
import { requireRole } from '../../common/middleware/requireRole.js';
import { createAuthenticateJwtMiddleware } from '../../common/middleware/authenticateJwt.js';
import { validateRequest } from '../../common/middleware/validateRequest.js';
import { ITokenService } from '../auth/interfaces/ITokenService.js';
import { CreateTripSchema, CalculatePriceSchema } from './dtos/CreateTripDTO.js';

export const createCustomerTripRouter = (
  controller: CustomerTripController,
  tokenService: ITokenService
): Router => {
  const router = Router();
  const authMiddleware = createAuthenticateJwtMiddleware(tokenService);
  const customerOnly = requireRole('CUSTOMER');

  router.use(authMiddleware, customerOnly);

  router.post('/calculate-price', validateRequest(CalculatePriceSchema), controller.calculatePrice);
  router.post('/', validateRequest(CreateTripSchema), controller.createTrip);
  router.get('/', controller.getTrips);
  router.get('/:tripId', controller.getTrip);

  return router;
};
