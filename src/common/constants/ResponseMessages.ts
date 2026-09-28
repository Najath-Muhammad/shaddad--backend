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

  // Driver Profile
  DRIVER_PROFILE_RETRIEVED: 'Driver profile retrieved successfully',
  DRIVER_PROFILE_UPDATED: 'Driver profile updated successfully',
  DRIVER_NOT_FOUND: 'Driver profile not found',

  // Vehicle
  VEHICLE_CREATED: 'Vehicle created successfully',
  VEHICLE_UPDATED: 'Vehicle updated successfully',
  VEHICLE_RETRIEVED: 'Vehicle retrieved successfully',
  VEHICLE_NOT_FOUND: 'Vehicle not found',
  VEHICLE_ALREADY_EXISTS: 'Driver already has a registered vehicle',
  PLATE_NUMBER_TAKEN: 'This plate number is already registered',

  // Documents
  DOCUMENTS_UPLOADED: 'Documents uploaded successfully',
  DOCUMENTS_RETRIEVED: 'Documents retrieved successfully',

  // Availability
  AVAILABILITY_UPDATED: 'Availability updated successfully',
  DRIVER_NOT_APPROVED: 'Only approved drivers can go online',
  DRIVER_NOT_VERIFIED: 'Driver must be approved to change availability',
  VEHICLE_REQUIRED_FOR_ONLINE:
    'A verified vehicle is required to go online',

  // Location
  LOCATION_UPDATED: 'Location updated successfully',
  DRIVER_MUST_BE_ONLINE: 'Driver must be online to update location',

  // Verification
  DRIVER_VERIFIED: 'Driver verification decision applied successfully',
  VERIFICATION_DECISION_INVALID:
    'Invalid verification decision. Use APPROVED, REJECTED, or SUSPENDED',

  // Nearby Drivers
  NEARBY_DRIVERS_RETRIEVED: 'Nearby drivers retrieved successfully',
  DRIVER_DETAILS_RETRIEVED: 'Driver details retrieved successfully',
  DRIVER_SELECTED: 'Driver selected successfully',
  DRIVER_UNAVAILABLE: 'Selected driver is not available',
  DRIVER_NOT_APPROVED_FOR_SELECTION: 'Selected driver is not approved',

  // Admin
  ADMIN_DRIVERS_LIST_RETRIEVED: 'Driver list retrieved successfully',
  ADMIN_DRIVER_DOSSIER_RETRIEVED: 'Driver dossier retrieved successfully',

  // Validation & System
  VALIDATION_ERROR: 'Validation error on request parameters',
  INTERNAL_SERVER_ERROR: 'Internal server error occurred. Please try again later',
  NOT_FOUND: 'The requested resource was not found',
  ROUTE_NOT_FOUND: 'The requested endpoint does not exist',
} as const;
