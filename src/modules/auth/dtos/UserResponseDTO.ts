import { UserRoleType, DriverVerificationStatusType } from '../../../common/constants/AppConstants.js';

export interface CustomerProfileDTO {
  id: string;
  defaultAddress: string | null;
  rating: number;
  totalTripsCount: number;
}

export interface DriverProfileDTO {
  id: string;
  nationalIdNumber: string | null;
  licenseNumber: string | null;
  verificationStatus: DriverVerificationStatusType;
  isOnline: boolean;
  rating: number;
  walletBalance: string;
}

export interface UserResponseDTO {
  id: string;
  phoneNumber: string;
  email: string | null;
  fullName: string;
  role: UserRoleType;
  isActive: boolean;
  createdAt: string;
  customerProfile?: CustomerProfileDTO | null;
  driverProfile?: DriverProfileDTO | null;
}
