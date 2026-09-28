import { Router } from 'express';
import { AuthController } from './controllers/AuthController.js';
import { validateRequest } from '../../common/middleware/validateRequest.js';
import { RegisterCustomerSchema } from './dtos/RegisterCustomerDTO.js';
import { RegisterDriverSchema } from './dtos/RegisterDriverDTO.js';
import { LoginSchema } from './dtos/LoginDTO.js';
import { RefreshTokenSchema } from './dtos/RefreshTokenDTO.js';
import { createAuthenticateJwtMiddleware } from '../../common/middleware/authenticateJwt.js';
import { ITokenService } from './interfaces/ITokenService.js';
import { ApiRoutes } from '../../common/constants/ApiRoutes.js';

export const createAuthRouter = (
  authController: AuthController,
  tokenService: ITokenService
): Router => {
  const router = Router();
  const authenticateJwt = createAuthenticateJwtMiddleware(tokenService);

  router.post(
    ApiRoutes.AUTH.REGISTER,
    validateRequest(RegisterCustomerSchema),
    authController.registerCustomer
  );

  router.post(
    `${ApiRoutes.AUTH.REGISTER}/driver`,
    validateRequest(RegisterDriverSchema),
    authController.registerDriver
  );

  router.post(
    ApiRoutes.AUTH.LOGIN,
    validateRequest(LoginSchema),
    authController.login
  );

  router.post(
    ApiRoutes.AUTH.REFRESH,
    validateRequest(RefreshTokenSchema),
    authController.refresh
  );

  router.post(
    ApiRoutes.AUTH.LOGOUT,
    validateRequest(RefreshTokenSchema),
    authController.logout
  );

  router.get(
    ApiRoutes.AUTH.ME,
    authenticateJwt,
    authController.me
  );

  return router;
};
