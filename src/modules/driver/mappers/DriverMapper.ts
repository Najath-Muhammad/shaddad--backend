import { DriverProfileResponseDTO, VehicleResponseDTO, NearbyDriverResponseDTO } from '../dtos/DriverResponses.js';

export class DriverMapper {
  static toVehicleResponse(vehicle: any): VehicleResponseDTO {
    if (!vehicle) return null as any;
    return {
      id: vehicle.id,
      vehicleType: vehicle.vehicleType,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      plateNumber: vehicle.plateNumber,
      color: vehicle.color,
      maxWeightKg: vehicle.maxWeightKg,
      maxLengthCm: vehicle.maxLengthCm,
      isRefrigerated: vehicle.isRefrigerated,
      isVerified: vehicle.isVerified,
      registrationUrl: vehicle.registrationUrl,
      insuranceUrl: vehicle.insuranceUrl,
      vehiclePhotoUrl: vehicle.vehiclePhotoUrl,
    };
  }

  static toDriverProfileResponse(driverProfile: any): DriverProfileResponseDTO {
    return {
      id: driverProfile.id,
      userId: driverProfile.userId,
      user: {
        fullName: driverProfile.user.fullName,
        phoneNumber: driverProfile.user.phoneNumber,
        email: driverProfile.user.email,
      },
      nationalIdNumber: driverProfile.nationalIdNumber,
      licenseNumber: driverProfile.licenseNumber,
      verificationStatus: driverProfile.verificationStatus,
      availability: driverProfile.availability,
      rating: driverProfile.rating,
      totalTripsCount: driverProfile.totalTripsCount,
      walletBalance: driverProfile.walletBalance,
      nationalIdFrontUrl: driverProfile.nationalIdFrontUrl,
      nationalIdBackUrl: driverProfile.nationalIdBackUrl,
      licenseUrl: driverProfile.licenseUrl,
      profilePhotoUrl: driverProfile.profilePhotoUrl,
      rejectionReason: driverProfile.rejectionReason,
      suspensionReason: driverProfile.suspensionReason,
      vehicle: driverProfile.vehicle ? this.toVehicleResponse(driverProfile.vehicle) : null,
    };
  }

  static toNearbyDriverResponse(driverProfile: any, distanceKm: number): NearbyDriverResponseDTO {
    return {
      id: driverProfile.id,
      userId: driverProfile.userId,
      fullName: driverProfile.user.fullName,
      rating: driverProfile.rating,
      totalTripsCount: driverProfile.totalTripsCount,
      profilePhotoUrl: driverProfile.profilePhotoUrl,
      distanceKm: distanceKm,
      latitude: driverProfile.currentLatitude,
      longitude: driverProfile.currentLongitude,
      vehicle: driverProfile.vehicle ? {
        vehicleType: driverProfile.vehicle.vehicleType,
        make: driverProfile.vehicle.make,
        model: driverProfile.vehicle.model,
        color: driverProfile.vehicle.color,
        isRefrigerated: driverProfile.vehicle.isRefrigerated,
        maxWeightKg: driverProfile.vehicle.maxWeightKg,
      } : null,
    };
  }
}
