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

// Pricing Module
import { PricingRepository } from './modules/pricing/repositories/PricingRepository.js';
import { PricingService } from './modules/pricing/services/PricingService.js';
import { IPricingRepository } from './modules/pricing/interfaces/IPricingRepository.js';
import { IPricingService } from './modules/pricing/interfaces/IPricingService.js';

// Trip Module
import { TripRepository } from './modules/trip/repositories/TripRepository.js';
import { TripService } from './modules/trip/services/TripService.js';
import { TripExpirationService } from './modules/trip/services/TripExpirationService.js';
import { CustomerTripController } from './modules/trip/controllers/CustomerTripController.js';
import { DriverTripController } from './modules/trip/controllers/DriverTripController.js';
import { ITripRepository } from './modules/trip/interfaces/ITripRepository.js';
import { ITripService } from './modules/trip/interfaces/ITripService.js';

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

  // Phase 3
  pricingRepository: IPricingRepository;
  pricingService: IPricingService;
  tripRepository: ITripRepository;
  tripService: ITripService;
  tripExpirationService: TripExpirationService;
  customerTripController: CustomerTripController;
  driverTripController: DriverTripController;

  // Phase 5
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentRepository: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentProvider: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentController: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminDashboardController: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminEntityController: any;
}

export const createContainer = (): AppContainer => {
  // Repositories
  const authRepository: IAuthRepository = new AuthRepository(prisma);
  const driverRepository: IDriverRepository = new DriverRepository(prisma);
  const driverLocationRepository: IDriverLocationRepository = new DriverLocationRepository(getRedisClient());
  const pricingRepository: IPricingRepository = new PricingRepository(prisma);
  const tripRepository: ITripRepository = new TripRepository(prisma);

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

  const { NotificationService } = require('./modules/notification/NotificationService.js');
  const notificationService = new NotificationService(prisma);

  const { PayoutRepository } = require('./modules/payout/repositories/PayoutRepository.js');
  const { MockPayoutProvider } = require('./modules/payout/providers/MockPayoutProvider.js');
  const { PayoutService } = require('./modules/payout/services/PayoutService.js');

  const payoutRepository = new PayoutRepository(prisma);
  const payoutProvider = new MockPayoutProvider();
  const payoutService = new PayoutService(payoutProvider, payoutRepository, driverRepository);

  const pricingService: IPricingService = new PricingService(pricingRepository);
  const tripService: ITripService = new TripService(tripRepository, pricingService, driverRepository, payoutService);
  const tripExpirationService = new TripExpirationService(tripRepository);

  // Controllers
  const authController = new AuthController(authService);
  const driverController = new DriverController(driverService, prisma);
  const adminDriverController = new AdminDriverController(driverService);
  const customerDriverController = new CustomerDriverController(driverService);
  const customerTripController = new CustomerTripController(tripService, prisma);
  const driverTripController = new DriverTripController(tripService, prisma);

  const { PaymentRepository } = require('./modules/payment/repositories/PaymentRepository.js');
  const { StripePaymentProvider } = require('./modules/payment/providers/StripePaymentProvider.js');
  const { PaymentService } = require('./modules/payment/services/PaymentService.js');
  const { PaymentController } = require('./modules/payment/controllers/PaymentController.js');

  const paymentRepository = new PaymentRepository(prisma);
  const paymentProvider = new StripePaymentProvider();
  const paymentService = new PaymentService(paymentProvider, paymentRepository, tripRepository, notificationService);
  const paymentController = new PaymentController(paymentService, prisma);

  const { AdminDashboardController } = require('./modules/admin/controllers/AdminDashboardController.js');
  const { AdminEntityController } = require('./modules/admin/controllers/AdminEntityController.js');
  const adminDashboardController = new AdminDashboardController(prisma);
  const adminEntityController = new AdminEntityController(prisma);

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

    pricingRepository,
    pricingService,
    tripRepository,
    tripService,
    tripExpirationService,
    customerTripController,
    driverTripController,

    paymentRepository,
    paymentProvider,
    paymentService,
    paymentController,
    
    adminDashboardController,
    adminEntityController
  };
};
