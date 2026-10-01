import { UserRole } from '@prisma/client';
import { IAuthService, AuthResult } from '../interfaces/IAuthService.js';
import { IAuthRepository } from '../interfaces/IAuthRepository.js';
import { ITokenService } from '../interfaces/ITokenService.js';
import { IHashService } from '../interfaces/IHashService.js';
import { RegisterCustomerDTO } from '../dtos/RegisterCustomerDTO.js';
import { RegisterDriverDTO } from '../dtos/RegisterDriverDTO.js';
import { LoginDTO } from '../dtos/LoginDTO.js';
import { RefreshTokenDTO } from '../dtos/RefreshTokenDTO.js';
import { UserResponseDTO } from '../dtos/UserResponseDTO.js';
import { AuthTokensDTO } from '../dtos/AuthTokensDTO.js';
import { UserResponseMapper } from '../mappers/UserResponseMapper.js';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from '../../../common/errors/HttpErrors.js';
import { ResponseMessages } from '../../../common/constants/ResponseMessages.js';
import { UserRoleType } from '../../../common/constants/AppConstants.js';
import { env } from '../../../config/env.js';

export class AuthService implements IAuthService {
  private readonly _authRepository: IAuthRepository;
  private readonly _tokenService: ITokenService;
  private readonly _hashService: IHashService;

  constructor(
    authRepository: IAuthRepository,
    tokenService: ITokenService,
    hashService: IHashService
  ) {
    this._authRepository = authRepository;
    this._tokenService = tokenService;
    this._hashService = hashService;
  }

  public async registerCustomer(dto: RegisterCustomerDTO): Promise<AuthResult> {
    const existingPhone = await this._authRepository.findUserByPhone(dto.phoneNumber);
    if (existingPhone) {
      throw new ConflictError(ResponseMessages.PHONE_ALREADY_EXISTS, 'PHONE_EXISTS');
    }

    if (dto.email) {
      const existingEmail = await this._authRepository.findUserByEmail(dto.email);
      if (existingEmail) {
        throw new ConflictError(ResponseMessages.EMAIL_ALREADY_EXISTS, 'EMAIL_EXISTS');
      }
    }

    const passwordHash = await this._hashService.hashPassword(dto.password);

    const user = await this._authRepository.createUser({
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      email: dto.email || null,
      passwordHash,
      role: UserRole.CUSTOMER,
    });

    const tokens = await this._issueAndStoreTokens({
      userId: user.id,
      role: user.role as UserRoleType,
      phoneNumber: user.phoneNumber,
      email: user.email,
    });

    return {
      user: UserResponseMapper.toDTO(user),
      tokens,
    };
  }

  public async registerDriver(dto: RegisterDriverDTO): Promise<AuthResult> {
    const existingPhone = await this._authRepository.findUserByPhone(dto.phoneNumber);
    if (existingPhone) {
      throw new ConflictError(ResponseMessages.PHONE_ALREADY_EXISTS, 'PHONE_EXISTS');
    }

    if (dto.email) {
      const existingEmail = await this._authRepository.findUserByEmail(dto.email);
      if (existingEmail) {
        throw new ConflictError(ResponseMessages.EMAIL_ALREADY_EXISTS, 'EMAIL_EXISTS');
      }
    }

    const passwordHash = await this._hashService.hashPassword(dto.password);

    const user = await this._authRepository.createUser({
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      email: dto.email || null,
      passwordHash,
      role: UserRole.DRIVER,
      nationalIdNumber: dto.nationalIdNumber,
      licenseNumber: dto.licenseNumber,
    });

    const tokens = await this._issueAndStoreTokens({
      userId: user.id,
      role: user.role as UserRoleType,
      phoneNumber: user.phoneNumber,
      email: user.email,
    });

    return {
      user: UserResponseMapper.toDTO(user),
      tokens,
    };
  }

  public async login(dto: LoginDTO): Promise<AuthResult> {
    const user = await this._authRepository.findUserByIdentifier(dto.identifier);
    if (!user) {
      throw new UnauthorizedError(ResponseMessages.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      const blockMsg = user.blockReason
        ? `Your account has been suspended. Reason: ${user.blockReason}`
        : ResponseMessages.ACCOUNT_INACTIVE;
      throw new ForbiddenError(blockMsg, 'ACCOUNT_INACTIVE');
    }

    const isPasswordValid = await this._hashService.comparePassword(
      dto.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError(ResponseMessages.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS');
    }

    if (dto.expectedRole && user.role !== dto.expectedRole) {
      throw new ForbiddenError(ResponseMessages.FORBIDDEN, 'ROLE_MISMATCH');
    }

    const tokens = await this._issueAndStoreTokens({
      userId: user.id,
      role: user.role as UserRoleType,
      phoneNumber: user.phoneNumber,
      email: user.email,
    });

    return {
      user: UserResponseMapper.toDTO(user),
      tokens,
    };
  }

  public async refreshToken(dto: RefreshTokenDTO): Promise<AuthTokensDTO> {
    const decoded = this._tokenService.verifyRefreshToken(dto.refreshToken);

    const tokenHash = this._hashService.hashToken(dto.refreshToken);
    const storedToken = await this._authRepository.findRefreshToken(tokenHash);

    if (!storedToken || storedToken.revokedAt !== null) {
      // Possible token reuse attempt: invalidate all tokens for security
      if (storedToken?.userId) {
        await this._authRepository.revokeAllUserTokens(storedToken.userId);
      }
      throw new UnauthorizedError(ResponseMessages.INVALID_REFRESH_TOKEN, 'INVALID_REFRESH_TOKEN');
    }

    if (new Date() > storedToken.expiresAt) {
      await this._authRepository.revokeRefreshToken(tokenHash);
      throw new UnauthorizedError(ResponseMessages.TOKEN_EXPIRED, 'REFRESH_TOKEN_EXPIRED');
    }

    // Revoke old refresh token (rotating)
    await this._authRepository.revokeRefreshToken(tokenHash);

    // Retrieve fresh user info
    const user = await this._authRepository.findUserById(decoded.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError(ResponseMessages.USER_NOT_FOUND, 'USER_INACTIVE');
    }

    // Issue and store new token pair
    return this._issueAndStoreTokens({
      userId: user.id,
      role: user.role as UserRoleType,
      phoneNumber: user.phoneNumber,
      email: user.email,
    });
  }

  public async logout(refreshToken: string): Promise<void> {
    try {
      const tokenHash = this._hashService.hashToken(refreshToken);
      await this._authRepository.revokeRefreshToken(tokenHash);
    } catch {
      // Idempotent logout
    }
  }

  public async getCurrentUser(userId: string): Promise<UserResponseDTO> {
    const user = await this._authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError(ResponseMessages.USER_NOT_FOUND, 'USER_NOT_FOUND');
    }

    return UserResponseMapper.toDTO(user);
  }

  private async _issueAndStoreTokens(payload: {
    userId: string;
    role: UserRoleType;
    phoneNumber: string;
    email?: string | null;
  }): Promise<AuthTokensDTO> {
    const tokens = this._tokenService.generateTokens(payload);
    const tokenHash = this._hashService.hashToken(tokens.refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.JWT_REFRESH_EXPIRATION_DAYS);

    await this._authRepository.saveRefreshToken(payload.userId, tokenHash, expiresAt);

    return tokens;
  }
}
