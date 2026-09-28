import { Request, Response, NextFunction } from 'express';
import { ITokenService } from '../../modules/auth/interfaces/ITokenService.js';
import { UnauthorizedError } from '../errors/HttpErrors.js';
import { ResponseMessages } from '../constants/ResponseMessages.js';

export const createAuthenticateJwtMiddleware = (tokenService: ITokenService) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError(ResponseMessages.UNAUTHORIZED, 'MISSING_BEARER_TOKEN');
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        throw new UnauthorizedError(ResponseMessages.UNAUTHORIZED, 'MISSING_BEARER_TOKEN');
      }

      const payload = tokenService.verifyAccessToken(token);
      req.user = payload;

      next();
    } catch (error) {
      next(error);
    }
  };
};
