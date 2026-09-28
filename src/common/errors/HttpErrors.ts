import { HttpStatusCodes } from '../constants/HttpStatusCodes.js';
import { AppError } from './AppError.js';

export class BadRequestError extends AppError {
  constructor(message: string, errorCode = 'BAD_REQUEST', details?: unknown) {
    super(message, HttpStatusCodes.BAD_REQUEST, errorCode, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', errorCode = 'UNAUTHORIZED', details?: unknown) {
    super(message, HttpStatusCodes.UNAUTHORIZED, errorCode, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access', errorCode = 'FORBIDDEN', details?: unknown) {
    super(message, HttpStatusCodes.FORBIDDEN, errorCode, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', errorCode = 'NOT_FOUND', details?: unknown) {
    super(message, HttpStatusCodes.NOT_FOUND, errorCode, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, errorCode = 'CONFLICT', details?: unknown) {
    super(message, HttpStatusCodes.CONFLICT, errorCode, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, HttpStatusCodes.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', details);
  }
}
