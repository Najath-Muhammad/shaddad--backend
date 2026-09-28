import { DriverVerificationStatusType, DriverAvailabilityType, VehicleTypeType } from '../../../common/constants/AppConstants.js';

export interface VehicleResponseDTO {
  id: string;
  vehicleType: VehicleTypeType;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  color: string;
  maxWeightKg: number;
  maxLengthCm: number | null;
  isRefrigerated: boolean;
  isVerified: boolean;
  registrationUrl: string | null;
  insuranceUrl: string | null;
  vehiclePhotoUrl: string | null;
}

export interface DriverProfileResponseDTO {
  id: string;
  userId: string;
  user: {
    fullName: string;
    phoneNumber: string;
    email: string | null;
  };
  nationalIdNumber: string | null;
  licenseNumber: string | null;
  verificationStatus: DriverVerificationStatusType;
  availability: DriverAvailabilityType;
  rating: number;
  totalTripsCount: number;
  walletBalance: string | number;
  nationalIdFrontUrl: string | null;
  nationalIdBackUrl: string | null;
  licenseUrl: string | null;
  profilePhotoUrl: string | null;
  rejectionReason: string | null;
  suspensionReason: string | null;
  vehicle: VehicleResponseDTO | null;
}

export interface NearbyDriverResponseDTO {
  id: string;
  userId: string;
  fullName: string;
  rating: number;
  totalTripsCount: number;
  profilePhotoUrl: string | null;
  distanceKm: number; // calculated from geospatial search
  latitude: number;
  longitude: number;
  vehicle: {
    vehicleType: VehicleTypeType;
    make: string;
    model: string;
    color: string;
    isRefrigerated: boolean;
    maxWeightKg: number;
  } | null;
}
