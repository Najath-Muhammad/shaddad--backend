import { prisma } from './config/database.js';
import { getRedisClient } from './config/redis.js';

// Auth Module
import { AuthRepository } from './modules/auth/repositories/AuthRepository.js';
import { HashService } from './modules/auth/services/HashService.js';
import { TokenService } from './modules/auth/services/TokenService.js';
import { AuthService } from './modules/auth/services/AuthService.js';
import { AuthController } from './modules/auth/controllers/AuthController.js';
import { IAuthRepository } from './modules/auth/interfaces/IAuthRepository.js';
import { IHashService } from './modules/auth/interfaces/IHashService.js';
import { ITokenService } from './modules/auth/interfaces/ITokenService.js';
import { IAuthService } from './modules/auth/interfaces/IAuthService.js';

// Driver Module
import { DriverRepository } from './modules/driver/repositories/DriverRepository.js';
import { DriverLocationRepository } from './modules/driver/repositories/DriverLocationRepository.js';
import { DriverService } from './modules/driver/services/DriverService.js';
import { DriverController } from './modules/driver/controllers/DriverController.js';
import { AdminDriverController } from './modules/driver/controllers/AdminDriverController.js';
import { CustomerDriverController } from './modules/driver/controllers/CustomerDriverController.js';
import { IDriverRepository } from './modules/driver/interfaces/IDriverRepository.js';
import { IDriverLocationRepository } from './modules/driver/interfaces/IDriverLocationRepository.js';
import { IDriverService } from './modules/driver/interfaces/IDriverService.js';

export interface AppContainer {
  // Auth
  authRepository: IAuthRepository;
  hashService: IHashService;
  tokenService: ITokenService;
  authService: IAuthService;
  authController: AuthController;
  
  // Driver
  driverRepository: IDriverRepository;
  driverLocationRepository: IDriverLocationRepository;
  driverService: IDriverService;
  driverController: DriverController;
  adminDriverController: AdminDriverController;
  customerDriverController: CustomerDriverController;
}

export const createContainer = (): AppContainer => {
  // Repositories
  const authRepository: IAuthRepository = new AuthRepository(prisma);
  const driverRepository: IDriverRepository = new DriverRepository(prisma);
  const driverLocationRepository: IDriverLocationRepository = new DriverLocationRepository(getRedisClient());

  // Core Services
  const hashService: IHashService = new HashService();
  const tokenService: ITokenService = new TokenService();

  // Domain Services
  const authService: IAuthService = new AuthService(
    authRepository,
    tokenService,
    hashService
  );
  
  const driverService: IDriverService = new DriverService(
    driverRepository,
    driverLocationRepository
  );

  // Controllers
  const authController = new AuthController(authService);
  const driverController = new DriverController(driverService);
  const adminDriverController = new AdminDriverController(driverService);
  const customerDriverController = new CustomerDriverController(driverService);

  return {
    authRepository,
    hashService,
    tokenService,
    authService,
    authController,
    
    driverRepository,
    driverLocationRepository,
    driverService,
    driverController,
    adminDriverController,
    customerDriverController,
  };
};
