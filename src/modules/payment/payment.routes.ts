import { Router } from 'express';
import { PaymentController } from './controllers/PaymentController.js';
import { createAuthenticateJwtMiddleware } from '../../common/middleware/authenticateJwt.js';
import { requireRole } from '../../common/middleware/requireRole.js';
import { ITokenService } from '../auth/interfaces/ITokenService.js';


export const createPaymentRouter = (
  controller: PaymentController,
  tokenService: ITokenService
): Router => {
  const router = Router();
  const authMiddleware = createAuthenticateJwtMiddleware(tokenService);

  // Webhook is mounted in app.ts for raw body parsing

  // Protected routes
  router.post('/trips/:tripId/initiate', authMiddleware, requireRole('CUSTOMER'), controller.initiatePayment);
  router.post('/trips/:tripId/simulate-success', authMiddleware, requireRole('CUSTOMER'), controller.simulateSuccess);

  return router;
};
