import { User, CustomerProfile, DriverProfile } from '@prisma/client';
import { UserResponseDTO } from '../dtos/UserResponseDTO.js';
import { UserRoleType, DriverVerificationStatusType } from '../../../common/constants/AppConstants.js';

export type UserWithProfiles = User & {
  customerProfile?: CustomerProfile | null;
  driverProfile?: DriverProfile | null;
};

export class UserResponseMapper {
  public static toDTO(user: UserWithProfiles): UserResponseDTO {
    const dto: UserResponseDTO = {
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      fullName: user.fullName,
      role: user.role as UserRoleType,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };

    if (user.customerProfile) {
      dto.customerProfile = {
        id: user.customerProfile.id,
        defaultAddress: user.customerProfile.defaultAddress,
        rating: user.customerProfile.rating,
        totalTripsCount: user.customerProfile.totalTripsCount,
      };
    }

    if (user.driverProfile) {
      dto.driverProfile = {
        id: user.driverProfile.id,
        nationalIdNumber: user.driverProfile.nationalIdNumber,
        licenseNumber: user.driverProfile.licenseNumber,
        verificationStatus: user.driverProfile.verificationStatus as DriverVerificationStatusType,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        availability: (user.driverProfile as any).availability, // workaround since prisma client type might be out of sync if not fully generated
        rating: user.driverProfile.rating,
        walletBalance: user.driverProfile.walletBalance.toString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    }

    return dto;
  }
}
