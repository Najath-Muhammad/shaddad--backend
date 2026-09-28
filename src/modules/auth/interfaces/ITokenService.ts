import { AuthenticatedUserPayload } from '../../../common/types/express.js';
import { AuthTokensDTO } from '../dtos/AuthTokensDTO.js';

export interface ITokenService {
  generateTokens(payload: AuthenticatedUserPayload): AuthTokensDTO;
  verifyAccessToken(token: string): AuthenticatedUserPayload;
  verifyRefreshToken(token: string): AuthenticatedUserPayload;
}
