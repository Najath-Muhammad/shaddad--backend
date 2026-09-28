import { Router } from 'express';
import { createAuthenticateJwtMiddleware } from '../../common/middleware/authenticateJwt.js';
import { requireRole } from '../../common/middleware/requireRole.js';
import { UserRole } from '../../common/constants/AppConstants.js';
import { ApiResponseBuilder } from '../../common/utils/ApiResponse.js';
import { ITokenService } from '../auth/interfaces/ITokenService.js';

export const createRoleTestRouter = (tokenService: ITokenService): Router => {
  const router = Router();
  const authenticateJwt = createAuthenticateJwtMiddleware(tokenService);

  // Customer-only endpoint
  router.get(
    '/customer-only',
    authenticateJwt,
    requireRole(UserRole.CUSTOMER),
    (req, res) => {
      res.json(
        ApiResponseBuilder.success(
          { message: 'Welcome Customer', user: req.user },
          'Customer access granted'
        )
      );
    }
  );

  // Driver-only endpoint
  router.get(
    '/driver-only',
    authenticateJwt,
    requireRole(UserRole.DRIVER),
    (req, res) => {
      res.json(
        ApiResponseBuilder.success(
          { message: 'Welcome Driver', user: req.user },
          'Driver access granted'
        )
      );
    }
  );

  // Admin-only endpoint
  router.get(
    '/admin-only',
    authenticateJwt,
    requireRole(UserRole.ADMIN),
    (req, res) => {
      res.json(
        ApiResponseBuilder.success(
          { message: 'Welcome Admin', user: req.user },
          'Admin access granted'
        )
      );
    }
  );

  return router;
};
