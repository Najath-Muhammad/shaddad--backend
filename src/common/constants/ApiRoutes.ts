export const ApiRoutes = {
  BASE_V1: '/api/v1',
  HEALTH: '/health',
  AUTH: {
    ROOT: '/auth',
    REGISTER: '/register',
    REGISTER_DRIVER: '/register/driver',
    LOGIN: '/login',
    REFRESH: '/refresh',
    LOGOUT: '/logout',
    ME: '/me',
  },
  DRIVER: {
    ROOT: '/drivers',
    PROFILE: '/profile',
    VEHICLE: '/vehicle',
    DOCUMENTS: '/documents',
    AVAILABILITY: '/availability',
    LOCATION: '/location',
  },
  ADMIN: {
    ROOT: '/admin',
    DRIVERS: '/drivers',
    DRIVERS_PENDING: '/drivers/pending',
    DRIVER_BY_ID: '/drivers/:driverProfileId',
    DRIVER_VERIFY: '/drivers/:driverProfileId/verify',
  },
  CUSTOMER: {
    ROOT: '/customers',
    NEARBY_DRIVERS: '/nearby-drivers',
    DRIVER_BY_ID: '/drivers/:driverProfileId',
    SELECT_DRIVER: '/select-driver',
  },
} as const;
