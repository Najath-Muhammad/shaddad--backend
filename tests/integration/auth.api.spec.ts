import request from 'supertest';
import { createApp } from '../../src/app.js';
import { AppContainer } from '../../src/composition-root.js';
import { IAuthRepository, CreateUserData } from '../../src/modules/auth/interfaces/IAuthRepository.js';
import { UserWithProfiles } from '../../src/modules/auth/mappers/UserResponseMapper.js';
import { TokenService } from '../../src/modules/auth/services/TokenService.js';
import { HashService } from '../../src/modules/auth/services/HashService.js';
import { AuthService } from '../../src/modules/auth/services/AuthService.js';
import { AuthController } from '../../src/modules/auth/controllers/AuthController.js';
import { UserRole, RefreshToken } from '@prisma/client';

class InMemoryAuthRepository implements IAuthRepository {
  private users: UserWithProfiles[] = [];
  private tokens: RefreshToken[] = [];

  public async findUserById(id: string): Promise<UserWithProfiles | null> {
    return this.users.find((u) => u.id === id) || null;
  }

  public async findUserByPhone(phoneNumber: string): Promise<UserWithProfiles | null> {
    return this.users.find((u) => u.phoneNumber === phoneNumber) || null;
  }

  public async findUserByEmail(email: string): Promise<UserWithProfiles | null> {
    return this.users.find((u) => u.email === email) || null;
  }

  public async findUserByIdentifier(identifier: string): Promise<UserWithProfiles | null> {
    return (
      this.users.find((u) => u.phoneNumber === identifier || u.email === identifier) ||
      null
    );
  }

  public async createUser(data: CreateUserData): Promise<UserWithProfiles> {
    const newUser: UserWithProfiles = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      email: data.email || null,
      passwordHash: data.passwordHash,
      role: data.role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      customerProfile:
        data.role === UserRole.CUSTOMER
          ? {
              id: `cp-${Date.now()}`,
              userId: `user-${Date.now()}`,
              defaultAddress: null,
              rating: 5.0,
              totalTripsCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          : null,
      driverProfile:
        data.role === UserRole.DRIVER
          ? {
              id: `dp-${Date.now()}`,
              userId: `user-${Date.now()}`,
              nationalIdNumber: data.nationalIdNumber || null,
              licenseNumber: data.licenseNumber || null,
              verificationStatus: 'PENDING',
              isOnline: false,
              rating: 5.0,
              walletBalance: 0 as unknown as import('@prisma/client/runtime/library.js').Decimal,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          : null,
    };

    this.users.push(newUser);
    return newUser;
  }

  public async saveRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<RefreshToken> {
    const token: RefreshToken = {
      id: `token-${Date.now()}`,
      userId,
      tokenHash,
      expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    };
    this.tokens.push(token);
    return token;
  }

  public async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    return this.tokens.find((t) => t.tokenHash === tokenHash) || null;
  }

  public async revokeRefreshToken(tokenHash: string): Promise<void> {
    const token = this.tokens.find((t) => t.tokenHash === tokenHash);
    if (token) {
      token.revokedAt = new Date();
    }
  }

  public async revokeAllUserTokens(userId: string): Promise<void> {
    this.tokens
      .filter((t) => t.userId === userId)
      .forEach((t) => {
        t.revokedAt = new Date();
      });
  }
}

describe('Auth API (Integration Tests)', () => {
  let app: ReturnType<typeof createApp>;
  let inMemoryRepo: InMemoryAuthRepository;
  let tokenService: TokenService;
  let hashService: HashService;
  let authService: AuthService;
  let authController: AuthController;

  beforeEach(() => {
    inMemoryRepo = new InMemoryAuthRepository();
    tokenService = new TokenService();
    hashService = new HashService();
    authService = new AuthService(inMemoryRepo, tokenService, hashService);
    authController = new AuthController(authService);

    const testContainer = {
      authRepository: inMemoryRepo,
      hashService,
      tokenService,
      authService,
      authController,
      driverController: {
        getProfile: (req: any, res: any) => res.json({}),
        getVehicle: (req: any, res: any) => res.json({}),
        createVehicle: (req: any, res: any) => res.json({}),
        updateVehicle: (req: any, res: any) => res.json({}),
        uploadDocuments: (req: any, res: any) => res.json({}),
        updateAvailability: (req: any, res: any) => res.json({}),
        updateLocation: (req: any, res: any) => res.json({}),
      } as any,
      adminDriverController: {
        getPendingDrivers: (req: any, res: any) => res.json({}),
        getDriverDossier: (req: any, res: any) => res.json({}),
        verifyDriver: (req: any, res: any) => res.json({}),
      } as any,
      customerDriverController: {
        getNearbyDrivers: (req: any, res: any) => res.json({}),
        getDriverDetails: (req: any, res: any) => res.json({}),
      } as any,
    } as AppContainer;

    app = createApp(testContainer);
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a customer successfully with 201 Created', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Sultan Al-Harbi',
          phoneNumber: '+966551234567',
          email: 'sultan@shaddad.sa',
          password: 'Password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('CUSTOMER');
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
      // Ensure passwordHash is not leaked
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should register a driver successfully with 201 Created', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/driver')
        .send({
          fullName: 'Fahad Al-Otaibi',
          phoneNumber: '+966559876543',
          password: 'Password123',
          nationalIdNumber: '1098765432',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('DRIVER');
      expect(res.body.data.user.driverProfile.verificationStatus).toBe('PENDING');
    });

    it('should reject invalid phone format with 422 Unprocessable Entity', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Invalid User',
          phoneNumber: '12345',
          password: 'Password123',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login and GET /api/v1/auth/me', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send({
        fullName: 'Test Customer',
        phoneNumber: '+966550001111',
        password: 'Password123',
      });
    });

    it('should login customer with valid credentials and retrieve profile with /me', async () => {
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        identifier: '+966550001111',
        password: 'Password123',
      });

      expect(loginRes.status).toBe(200);
      const accessToken = loginRes.body.data.tokens.accessToken;
      const refreshToken = loginRes.body.data.tokens.refreshToken;

      // Access /me with bearer token
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.phoneNumber).toBe('+966550001111');
      expect(meRes.body.data.role).toBe('CUSTOMER');

      // Test refresh token
      const refreshRes = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken,
      });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.accessToken).toBeDefined();

      // Test logout
      const logoutRes = await request(app).post('/api/v1/auth/logout').send({
        refreshToken,
      });
      expect(logoutRes.status).toBe(200);
    });

    it('should reject invalid password with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: '+966550001111',
        password: 'WrongPassword999',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request to /me without token with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    let customerToken: string;
    let driverToken: string;

    beforeEach(async () => {
      // Register customer
      const cRes = await request(app).post('/api/v1/auth/register').send({
        fullName: 'Customer Sultan',
        phoneNumber: '+966551111111',
        password: 'Password123',
      });
      customerToken = cRes.body.data.tokens.accessToken;

      // Register driver
      const dRes = await request(app).post('/api/v1/auth/register/driver').send({
        fullName: 'Driver Fahad',
        phoneNumber: '+966552222222',
        password: 'Password123',
      });
      driverToken = dRes.body.data.tokens.accessToken;
    });

    it('customer can access customer-only endpoint but NOT driver-only endpoint', async () => {
      // Customer accesses customer route -> 200
      const cSuccess = await request(app)
        .get('/api/v1/roles/customer-only')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(cSuccess.status).toBe(200);

      // Customer accesses driver route -> 403 Forbidden
      const cFail = await request(app)
        .get('/api/v1/roles/driver-only')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(cFail.status).toBe(403);
      expect(cFail.body.error.code).toBe('FORBIDDEN');
    });

    it('driver can access driver-only endpoint but NOT customer-only endpoint', async () => {
      // Driver accesses driver route -> 200
      const dSuccess = await request(app)
        .get('/api/v1/roles/driver-only')
        .set('Authorization', `Bearer ${driverToken}`);
      expect(dSuccess.status).toBe(200);

      // Driver accesses customer route -> 403 Forbidden
      const dFail = await request(app)
        .get('/api/v1/roles/customer-only')
        .set('Authorization', `Bearer ${driverToken}`);
      expect(dFail.status).toBe(403);
      expect(dFail.body.error.code).toBe('FORBIDDEN');
    });
  });
});
