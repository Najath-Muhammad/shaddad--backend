import { Router } from 'express';
import { AdminDashboardController } from './controllers/AdminDashboardController.js';
import { ITokenService } from '../auth/interfaces/ITokenService.js';
import { createAuthenticateJwtMiddleware } from '../../common/middleware/authenticateJwt.js';
import { requireRole } from '../../common/middleware/requireRole.js';

export const createAdminDashboardRouter = (
  adminDashboardController: AdminDashboardController,
  tokenService: ITokenService
): Router => {
  const router = Router();
  const authenticateJwt = createAuthenticateJwtMiddleware(tokenService);
  const requireAdmin = requireRole('ADMIN');

  // Protect all admin routes
  router.use(authenticateJwt, requireAdmin);

  router.get('/metrics', adminDashboardController.getMetrics);

  return router;
};
