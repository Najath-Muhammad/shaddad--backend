import { prisma } from './config/database.js';
import { AuthRepository } from './modules/auth/repositories/AuthRepository.js';
import { HashService } from './modules/auth/services/HashService.js';
import { TokenService } from './modules/auth/services/TokenService.js';
import { AuthService } from './modules/auth/services/AuthService.js';
import { AuthController } from './modules/auth/controllers/AuthController.js';
import { IAuthRepository } from './modules/auth/interfaces/IAuthRepository.js';
import { IHashService } from './modules/auth/interfaces/IHashService.js';
import { ITokenService } from './modules/auth/interfaces/ITokenService.js';
import { IAuthService } from './modules/auth/interfaces/IAuthService.js';

export interface AppContainer {
  authRepository: IAuthRepository;
  hashService: IHashService;
  tokenService: ITokenService;
  authService: IAuthService;
  authController: AuthController;
}

export const createContainer = (): AppContainer => {
  // Repositories
  const authRepository: IAuthRepository = new AuthRepository(prisma);

  // Core Services
  const hashService: IHashService = new HashService();
  const tokenService: ITokenService = new TokenService();

  // Domain Services
  const authService: IAuthService = new AuthService(
    authRepository,
    tokenService,
    hashService
  );

  // Controllers
  const authController = new AuthController(authService);

  return {
    authRepository,
    hashService,
    tokenService,
    authService,
    authController,
  };
};
