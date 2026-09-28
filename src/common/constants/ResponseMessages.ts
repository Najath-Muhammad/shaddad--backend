export const ResponseMessages = {
  // Auth Success
  USER_REGISTERED_SUCCESSFULLY: 'User registered successfully',
  LOGIN_SUCCESSFUL: 'Login successful',
  LOGOUT_SUCCESSFUL: 'Logout successful',
  TOKEN_REFRESHED_SUCCESSFULLY: 'Token refreshed successfully',
  PROFILE_RETRIEVED_SUCCESSFULLY: 'Profile retrieved successfully',

  // Auth Errors
  INVALID_CREDENTIALS: 'Invalid phone/email or password',
  USER_ALREADY_EXISTS: 'A user with this phone number or email already exists',
  PHONE_ALREADY_EXISTS: 'This phone number is already registered',
  EMAIL_ALREADY_EXISTS: 'This email is already registered',
  UNAUTHORIZED: 'Authentication required. Invalid or missing token',
  FORBIDDEN: 'Access denied. You do not have permission for this resource',
  TOKEN_EXPIRED: 'Token has expired. Please refresh your session',
  INVALID_REFRESH_TOKEN: 'Invalid or revoked refresh token',
  USER_NOT_FOUND: 'User account not found',
  ACCOUNT_INACTIVE: 'Account is deactivated. Please contact support',

  // Validation & System
  VALIDATION_ERROR: 'Validation error on request parameters',
  INTERNAL_SERVER_ERROR: 'Internal server error occurred. Please try again later',
  NOT_FOUND: 'The requested resource was not found',
  ROUTE_NOT_FOUND: 'The requested endpoint does not exist',
} as const;
