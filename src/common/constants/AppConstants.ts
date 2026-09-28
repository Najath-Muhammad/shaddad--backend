export const UserRole = {
  CUSTOMER: 'CUSTOMER',
  DRIVER: 'DRIVER',
  ADMIN: 'ADMIN',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const DriverVerificationStatus = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const;

export type DriverVerificationStatusType =
  (typeof DriverVerificationStatus)[keyof typeof DriverVerificationStatus];

export const DriverAvailability = {
  OFFLINE: 'OFFLINE',
  ONLINE: 'ONLINE',
  BUSY: 'BUSY',
} as const;

export type DriverAvailabilityType =
  (typeof DriverAvailability)[keyof typeof DriverAvailability];

export const VehicleType = {
  DYNA: 'DYNA',
  PICKUP_SMALL: 'PICKUP_SMALL',
  PICKUP_LARGE: 'PICKUP_LARGE',
  TRAILER: 'TRAILER',
  FLATBED: 'FLATBED',
  REFRIGERATED: 'REFRIGERATED',
  BOX_TRUCK: 'BOX_TRUCK',
} as const;

export type VehicleTypeType = (typeof VehicleType)[keyof typeof VehicleType];

export const AppConstants = {
  DEFAULT_PORT: 5000,
  PASSWORD_SALT_ROUNDS: 10,
  ACCESS_TOKEN_EXPIRATION: '15m',
  REFRESH_TOKEN_EXPIRATION_DAYS: 7,
  PHONE_REGEX_SAUDI: /^(\+966|0)?5\d{8}$/,
  NEARBY_DRIVER_DEFAULT_RADIUS_KM: 10,
  MAX_NEARBY_DRIVER_RADIUS_KM: 50,
  UPLOADS_DIR: 'uploads',
} as const;
