export const ApiRoutes = {
  BASE_V1: '/api/v1',
  HEALTH: '/health',
  AUTH: {
    ROOT: '/auth',
    REGISTER: '/register',
    LOGIN: '/login',
    REFRESH: '/refresh',
    LOGOUT: '/logout',
    ME: '/me',
  },
  CUSTOMER: {
    ROOT: '/customers',
  },
  DRIVER: {
    ROOT: '/drivers',
  },
  ADMIN: {
    ROOT: '/admin',
  },
} as const;
