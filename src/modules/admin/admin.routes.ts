import { Router } from 'express';
import { AdminDashboardController } from './controllers/AdminDashboardController.js';
import { AdminEntityController } from './controllers/AdminEntityController.js';
import { ITokenService } from '../auth/interfaces/ITokenService.js';
import { createAuthenticateJwtMiddleware } from '../../common/middleware/authenticateJwt.js';
import { requireRole } from '../../common/middleware/requireRole.js';

export const createAdminDashboardRouter = (
  adminDashboardController: AdminDashboardController,
  adminEntityController: AdminEntityController,
  tokenService: ITokenService
): Router => {
  const router = Router();
  const authenticateJwt = createAuthenticateJwtMiddleware(tokenService);
  const requireAdmin = requireRole('ADMIN');

  // Protect all admin routes
  router.use(authenticateJwt, requireAdmin);

  router.get('/metrics', adminDashboardController.getMetrics);
  
  router.get('/customers', adminEntityController.getAllCustomers);
  router.get('/drivers', adminEntityController.getAllDrivers);
  router.get('/trips', adminEntityController.getAllTrips);
  
  router.post('/users/:userId/toggle-block', adminEntityController.toggleUserBlock);
  router.get('/drivers/:driverProfileId/rating-history', adminEntityController.getDriverRatingHistory);

  return router;
};
