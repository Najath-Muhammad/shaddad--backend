export const UserRole = {
  CUSTOMER: 'CUSTOMER',
  DRIVER: 'DRIVER',
  ADMIN: 'ADMIN',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const DriverVerificationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const;

export type DriverVerificationStatusType =
  (typeof DriverVerificationStatus)[keyof typeof DriverVerificationStatus];

export const AppConstants = {
  DEFAULT_PORT: 5000,
  PASSWORD_SALT_ROUNDS: 10,
  ACCESS_TOKEN_EXPIRATION: '15m',
  REFRESH_TOKEN_EXPIRATION_DAYS: 7,
  PHONE_REGEX_SAUDI: /^(\+966|0)?5\d{8}$/,
} as const;
