import { Request, Response, NextFunction } from 'express';
import { UserRoleType } from '../constants/AppConstants.js';
import { ForbiddenError, UnauthorizedError } from '../errors/HttpErrors.js';
import { ResponseMessages } from '../constants/ResponseMessages.js';

export const requireRole = (...allowedRoles: UserRoleType[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError(ResponseMessages.UNAUTHORIZED));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          ResponseMessages.FORBIDDEN,
          'FORBIDDEN',
          { required: allowedRoles, actual: req.user.role }
        )
      );
    }

    next();
  };
};
