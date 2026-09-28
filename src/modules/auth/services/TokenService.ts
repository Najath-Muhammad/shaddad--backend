import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ITokenService } from '../interfaces/ITokenService.js';
import { AuthenticatedUserPayload } from '../../../common/types/express.js';
import { AuthTokensDTO } from '../dtos/AuthTokensDTO.js';
import { UnauthorizedError } from '../../../common/errors/HttpErrors.js';
import { ResponseMessages } from '../../../common/constants/ResponseMessages.js';
import { env } from '../../../config/env.js';

export class TokenService implements ITokenService {
  private readonly _accessSecret: string;
  private readonly _refreshSecret: string;
  private readonly _accessExpiry: string;
  private readonly _refreshExpiryDays: number;

  constructor(
    accessSecret: string = env.JWT_ACCESS_SECRET,
    refreshSecret: string = env.JWT_REFRESH_SECRET,
    accessExpiry: string = env.JWT_ACCESS_EXPIRATION,
    refreshExpiryDays: number = env.JWT_REFRESH_EXPIRATION_DAYS
  ) {
    this._accessSecret = accessSecret;
    this._refreshSecret = refreshSecret;
    this._accessExpiry = accessExpiry;
    this._refreshExpiryDays = refreshExpiryDays;
  }

  public generateTokens(payload: AuthenticatedUserPayload): AuthTokensDTO {
    const tokenId = crypto.randomUUID();

    const accessToken = jwt.sign(
      {
        userId: payload.userId,
        role: payload.role,
        phoneNumber: payload.phoneNumber,
        email: payload.email,
        jti: tokenId,
      },
      this._accessSecret,
      { expiresIn: this._accessExpiry as jwt.SignOptions['expiresIn'] }
    );

    const refreshToken = jwt.sign(
      {
        userId: payload.userId,
        role: payload.role,
        jti: crypto.randomUUID(),
      },
      this._refreshSecret,
      { expiresIn: `${this._refreshExpiryDays}d` }
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this._accessExpiry,
    };
  }

  public verifyAccessToken(token: string): AuthenticatedUserPayload {
    try {
      const decoded = jwt.verify(token, this._accessSecret) as AuthenticatedUserPayload;
      return {
        userId: decoded.userId,
        role: decoded.role,
        phoneNumber: decoded.phoneNumber,
        email: decoded.email,
      };
    } catch (error: unknown) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError(ResponseMessages.TOKEN_EXPIRED, 'TOKEN_EXPIRED');
      }
      throw new UnauthorizedError(ResponseMessages.UNAUTHORIZED, 'INVALID_TOKEN');
    }
  }

  public verifyRefreshToken(token: string): AuthenticatedUserPayload {
    try {
      const decoded = jwt.verify(token, this._refreshSecret) as AuthenticatedUserPayload;
      return {
        userId: decoded.userId,
        role: decoded.role,
        phoneNumber: decoded.phoneNumber,
        email: decoded.email,
      };
    } catch (error: unknown) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError(ResponseMessages.TOKEN_EXPIRED, 'REFRESH_TOKEN_EXPIRED');
      }
      throw new UnauthorizedError(ResponseMessages.INVALID_REFRESH_TOKEN, 'INVALID_REFRESH_TOKEN');
    }
  }
}
