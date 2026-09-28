import { PrismaClient } from '@prisma/client';
import { IDriverRepository } from '../interfaces/IDriverRepository.js';
import { CreateVehicleDTO } from '../dtos/CreateVehicleDTO.js';
import { UpdateVehicleDTO } from '../dtos/UpdateVehicleDTO.js';
import { DriverVerificationStatusType, DriverAvailability, VehicleTypeType } from '../../../common/constants/AppConstants.js';

export class DriverRepository implements IDriverRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async findProfileById(id: string): Promise<any | null> {
    return this._prisma.driverProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { fullName: true, phoneNumber: true, email: true },
        },
        vehicle: true,
      },
    });
  }

  async findProfileByUserId(userId: string): Promise<any | null> {
    return this._prisma.driverProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { fullName: true, phoneNumber: true, email: true },
        },
        vehicle: true,
      },
    });
  }

  async findVehicleByDriverProfileId(driverProfileId: string): Promise<any | null> {
    return this._prisma.vehicle.findUnique({
      where: { driverProfileId },
    });
  }

  async findVehicleByPlateNumber(plateNumber: string): Promise<any | null> {
    return this._prisma.vehicle.findUnique({
      where: { plateNumber },
    });
  }

  async createVehicle(driverProfileId: string, data: CreateVehicleDTO): Promise<any> {
    return this._prisma.vehicle.create({
      data: {
        driverProfileId,
        vehicleType: data.vehicleType as VehicleTypeType,
        make: data.make,
        model: data.model,
        year: data.year,
        plateNumber: data.plateNumber,
        color: data.color,
        maxWeightKg: data.maxWeightKg,
        maxLengthCm: data.maxLengthCm,
        isRefrigerated: data.isRefrigerated,
      },
    });
  }

  async updateVehicle(driverProfileId: string, data: UpdateVehicleDTO): Promise<any> {
    return this._prisma.vehicle.update({
      where: { driverProfileId },
      data: {
        ...(data.vehicleType && { vehicleType: data.vehicleType as VehicleTypeType }),
        ...(data.make && { make: data.make }),
        ...(data.model && { model: data.model }),
        ...(data.year && { year: data.year }),
        ...(data.plateNumber && { plateNumber: data.plateNumber }),
        ...(data.color && { color: data.color }),
        ...(data.maxWeightKg && { maxWeightKg: data.maxWeightKg }),
        ...(data.maxLengthCm !== undefined && { maxLengthCm: data.maxLengthCm }),
        ...(data.isRefrigerated !== undefined && { isRefrigerated: data.isRefrigerated }),
      },
    });
  }

  async updateProfileDocuments(driverProfileId: string, documents: Record<string, string>): Promise<any> {
    return this._prisma.driverProfile.update({
      where: { id: driverProfileId },
      data: documents,
      include: {
        user: { select: { fullName: true, phoneNumber: true, email: true } },
        vehicle: true,
      },
    });
  }

  async updateVehicleDocuments(vehicleId: string, documents: Record<string, string>): Promise<any> {
    return this._prisma.vehicle.update({
      where: { id: vehicleId },
      data: documents,
    });
  }

  async updateAvailability(driverProfileId: string, availability: string): Promise<any> {
    return this._prisma.driverProfile.update({
      where: { id: driverProfileId },
      data: { availability: availability as any },
    });
  }

  async updateLocation(driverProfileId: string, latitude: number, longitude: number): Promise<any> {
    return this._prisma.driverProfile.update({
      where: { id: driverProfileId },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationAt: new Date(),
      },
    });
  }

  async findPendingDrivers(): Promise<any[]> {
    return this._prisma.driverProfile.findMany({
      where: { verificationStatus: 'PENDING_VERIFICATION' },
      include: {
        user: { select: { fullName: true, phoneNumber: true, email: true } },
        vehicle: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateVerificationStatus(
    driverProfileId: string,
    status: DriverVerificationStatusType,
    adminId: string,
    reason?: string
  ): Promise<any> {
    return this._prisma.driverProfile.update({
      where: { id: driverProfileId },
      data: {
        verificationStatus: status,
        ...(status === 'APPROVED' && { verifiedAt: new Date(), verifiedByAdminId: adminId }),
        ...(status === 'REJECTED' && { rejectionReason: reason }),
        ...(status === 'SUSPENDED' && { suspensionReason: reason, availability: DriverAvailability.OFFLINE }),
      },
      include: {
        user: { select: { fullName: true, phoneNumber: true, email: true } },
        vehicle: true,
      },
    });
  }

  async findNearbyDrivers(latitude: number, longitude: number, radiusKm: number, vehicleType?: string): Promise<any[]> {
    // Haversine formula fallback implemented in raw SQL
    // 6371 is the radius of the Earth in kilometers
    
    // Create base query
    const results = await this._prisma.$queryRawUnsafe<any[]>(`
      SELECT dp.*, u."fullName", v."vehicleType", v."make", v."model", v."color", v."isRefrigerated", v."maxWeightKg",
             ( 6371 * acos( cos( radians(${latitude}) ) * cos( radians( dp."currentLatitude" ) ) 
             * cos( radians( dp."currentLongitude" ) - radians(${longitude}) ) 
             + sin( radians(${latitude}) ) * sin( radians( dp."currentLatitude" ) ) ) ) AS "distanceKm"
      FROM driver_profiles dp
      INNER JOIN users u ON dp."userId" = u.id
      LEFT JOIN vehicles v ON dp.id = v."driverProfileId"
      WHERE dp."availability" = 'ONLINE'
        AND dp."currentLatitude" IS NOT NULL
        AND dp."currentLongitude" IS NOT NULL
        ${vehicleType ? `AND v."vehicleType" = '${vehicleType}'` : ''}
      HAVING ( 6371 * acos( cos( radians(${latitude}) ) * cos( radians( dp."currentLatitude" ) ) 
             * cos( radians( dp."currentLongitude" ) - radians(${longitude}) ) 
             + sin( radians(${latitude}) ) * sin( radians( dp."currentLatitude" ) ) ) ) <= ${radiusKm}
      ORDER BY "distanceKm" ASC
    `);

    // Map raw results to the structure expected by the mapper
    return results.map(row => ({
      id: row.id,
      userId: row.userId,
      currentLatitude: row.currentLatitude,
      currentLongitude: row.currentLongitude,
      rating: row.rating,
      totalTripsCount: row.totalTripsCount,
      profilePhotoUrl: row.profilePhotoUrl,
      distanceKm: row.distanceKm,
      user: { fullName: row.fullName },
      vehicle: row.vehicleType ? {
        vehicleType: row.vehicleType,
        make: row.make,
        model: row.model,
        color: row.color,
        isRefrigerated: row.isRefrigerated,
        maxWeightKg: row.maxWeightKg
      } : null
    }));
  }

  async findDriversByIds(ids: string[], vehicleType?: string): Promise<any[]> {
    if (!ids.length) return [];
    
    return this._prisma.driverProfile.findMany({
      where: {
        id: { in: ids },
        availability: 'ONLINE',
        ...(vehicleType && {
          vehicle: {
            vehicleType: vehicleType as VehicleTypeType
          }
        })
      },
      include: {
        user: { select: { fullName: true } },
        vehicle: true,
      },
    });
  }
}
