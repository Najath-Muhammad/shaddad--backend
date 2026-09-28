import { AuthService } from '../../src/modules/auth/services/AuthService.js';
import { IAuthRepository } from '../../src/modules/auth/interfaces/IAuthRepository.js';
import { ITokenService } from '../../src/modules/auth/interfaces/ITokenService.js';
import { IHashService } from '../../src/modules/auth/interfaces/IHashService.js';
import { UserRole } from '@prisma/client';
import { ConflictError, UnauthorizedError } from '../../src/common/errors/HttpErrors.js';
import { UserWithProfiles } from '../../src/modules/auth/mappers/UserResponseMapper.js';

describe('AuthService (Unit Tests)', () => {
  let authService: AuthService;
  let mockAuthRepo: jest.Mocked<IAuthRepository>;
  let mockTokenService: jest.Mocked<ITokenService>;
  let mockHashService: jest.Mocked<IHashService>;

  const mockUser: UserWithProfiles = {
    id: 'user-uuid-1',
    fullName: 'Ahmed Ali',
    phoneNumber: '+966512345678',
    email: 'ahmed@example.com',
    passwordHash: 'hashed_password_123',
    role: UserRole.CUSTOMER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    customerProfile: {
      id: 'profile-uuid-1',
      userId: 'user-uuid-1',
      defaultAddress: null,
      rating: 5.0,
      totalTripsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    driverProfile: null,
  };

  const mockTokens = {
    accessToken: 'mock_access_token',
    refreshToken: 'mock_refresh_token',
    tokenType: 'Bearer' as const,
    expiresIn: '15m',
  };

  beforeEach(() => {
    mockAuthRepo = {
      findUserById: jest.fn(),
      findUserByPhone: jest.fn(),
      findUserByEmail: jest.fn(),
      findUserByIdentifier: jest.fn(),
      createUser: jest.fn(),
      saveRefreshToken: jest.fn(),
      findRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
      revokeAllUserTokens: jest.fn(),
    };

    mockTokenService = {
      generateTokens: jest.fn().mockReturnValue(mockTokens),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };

    mockHashService = {
      hashPassword: jest.fn().mockResolvedValue('hashed_password_123'),
      comparePassword: jest.fn().mockResolvedValue(true),
      hashToken: jest.fn().mockReturnValue('hashed_token_abc'),
    };

    authService = new AuthService(mockAuthRepo, mockTokenService, mockHashService);
  });

  describe('registerCustomer', () => {
    it('should successfully register a customer and return tokens', async () => {
      mockAuthRepo.findUserByPhone.mockResolvedValue(null);
      mockAuthRepo.findUserByEmail.mockResolvedValue(null);
      mockAuthRepo.createUser.mockResolvedValue(mockUser);
      mockAuthRepo.saveRefreshToken.mockResolvedValue({
        id: 'token-id',
        userId: mockUser.id,
        tokenHash: 'hashed_token_abc',
        expiresAt: new Date(Date.now() + 7 * 86400000),
        revokedAt: null,
        createdAt: new Date(),
      });

      const result = await authService.registerCustomer({
        fullName: 'Ahmed Ali',
        phoneNumber: '+966512345678',
        email: 'ahmed@example.com',
        password: 'Password123',
      });

      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.role).toBe('CUSTOMER');
      expect(result.tokens.accessToken).toBe('mock_access_token');
      expect(mockHashService.hashPassword).toHaveBeenCalledWith('Password123');
      expect(mockAuthRepo.createUser).toHaveBeenCalled();
    });

    it('should throw ConflictError if phone number is already registered', async () => {
      mockAuthRepo.findUserByPhone.mockResolvedValue(mockUser);

      await expect(
        authService.registerCustomer({
          fullName: 'Ahmed Ali',
          phoneNumber: '+966512345678',
          password: 'Password123',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    it('should login valid user and return user info + tokens', async () => {
      mockAuthRepo.findUserByIdentifier.mockResolvedValue(mockUser);
      mockHashService.comparePassword.mockResolvedValue(true);

      const result = await authService.login({
        identifier: '+966512345678',
        password: 'Password123',
      });

      expect(result.user.phoneNumber).toBe('+966512345678');
      expect(result.tokens.accessToken).toBe('mock_access_token');
    });

    it('should throw UnauthorizedError on invalid password', async () => {
      mockAuthRepo.findUserByIdentifier.mockResolvedValue(mockUser);
      mockHashService.comparePassword.mockResolvedValue(false);

      await expect(
        authService.login({
          identifier: '+966512345678',
          password: 'WrongPassword',
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('refreshToken', () => {
    it('should rotate refresh token and issue new token pair', async () => {
      mockTokenService.verifyRefreshToken.mockReturnValue({
        userId: mockUser.id,
        role: 'CUSTOMER',
        phoneNumber: mockUser.phoneNumber,
        email: mockUser.email,
      });

      mockAuthRepo.findRefreshToken.mockResolvedValue({
        id: 'token-1',
        userId: mockUser.id,
        tokenHash: 'hashed_token_abc',
        expiresAt: new Date(Date.now() + 86400000), // Not expired
        revokedAt: null,
        createdAt: new Date(),
      });

      mockAuthRepo.findUserById.mockResolvedValue(mockUser);

      const result = await authService.refreshToken({
        refreshToken: 'mock_refresh_token',
      });

      expect(result.accessToken).toBe('mock_access_token');
      expect(mockAuthRepo.revokeRefreshToken).toHaveBeenCalledWith('hashed_token_abc');
      expect(mockAuthRepo.saveRefreshToken).toHaveBeenCalled();
    });
  });
});
