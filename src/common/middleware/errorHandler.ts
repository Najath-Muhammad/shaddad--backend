import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { HttpStatusCodes } from '../constants/HttpStatusCodes.js';
import { ResponseMessages } from '../constants/ResponseMessages.js';
import { ApiResponseBuilder } from '../utils/ApiResponse.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn(
      {
        path: req.path,
        method: req.method,
        statusCode: err.statusCode,
        errorCode: err.errorCode,
        message: err.message,
        details: err.details,
      },
      'Operational Error'
    );

    res
      .status(err.statusCode)
      .json(ApiResponseBuilder.error(err.errorCode, err.message, err.details));
    return;
  }

  // Unhandled / Internal Server Error
  logger.error(
    {
      path: req.path,
      method: req.method,
      err: err.message,
      stack: err.stack,
    },
    'Unhandled Server Error'
  );

  res
    .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
    .json(
      ApiResponseBuilder.error(
        'INTERNAL_SERVER_ERROR',
        ResponseMessages.INTERNAL_SERVER_ERROR
      )
    );
};
