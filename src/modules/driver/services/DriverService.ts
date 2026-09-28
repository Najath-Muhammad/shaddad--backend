import { IDriverService } from '../interfaces/IDriverService.js';
import { IDriverRepository } from '../interfaces/IDriverRepository.js';
import { IDriverLocationRepository } from '../interfaces/IDriverLocationRepository.js';
import { CreateVehicleDTO } from '../dtos/CreateVehicleDTO.js';
import { UpdateVehicleDTO } from '../dtos/UpdateVehicleDTO.js';
import { UpdateAvailabilityDTO } from '../dtos/UpdateAvailabilityDTO.js';
import { UpdateLocationDTO } from '../dtos/UpdateLocationDTO.js';
import { VerifyDriverDTO } from '../dtos/VerifyDriverDTO.js';
import { NearbyDriversQueryDTO } from '../dtos/NearbyDriversQueryDTO.js';
import { DriverProfileResponseDTO, VehicleResponseDTO, NearbyDriverResponseDTO } from '../dtos/DriverResponses.js';
import { DriverMapper } from '../mappers/DriverMapper.js';
import { AppError } from '../../../common/errors/AppError.js';
import { HttpStatusCodes } from '../../../common/constants/HttpStatusCodes.js';
import { ResponseMessages } from '../../../common/constants/ResponseMessages.js';
import { DriverVerificationStatus, DriverAvailability } from '../../../common/constants/AppConstants.js';
import { logger } from '../../../common/utils/logger.js';

export class DriverService implements IDriverService {
  constructor(
    private readonly _driverRepository: IDriverRepository,
    private readonly _locationRepository: IDriverLocationRepository
  ) {}

  private async getDriverProfileByUserIdOrThrow(userId: string) {
    const profile = await this._driverRepository.findProfileByUserId(userId);
    if (!profile) {
      throw new AppError(ResponseMessages.DRIVER_NOT_FOUND, HttpStatusCodes.NOT_FOUND, 'NOT_FOUND');
    }
    return profile;
  }

  async getProfile(userId: string): Promise<DriverProfileResponseDTO> {
    const profile = await this.getDriverProfileByUserIdOrThrow(userId);
    return DriverMapper.toDriverProfileResponse(profile);
  }

  async getVehicle(userId: string): Promise<VehicleResponseDTO> {
    const profile = await this.getDriverProfileByUserIdOrThrow(userId);
    if (!profile.vehicle) {
      throw new AppError(ResponseMessages.VEHICLE_NOT_FOUND, HttpStatusCodes.NOT_FOUND, 'NOT_FOUND');
    }
    return DriverMapper.toVehicleResponse(profile.vehicle);
  }

  async createVehicle(userId: string, data: CreateVehicleDTO): Promise<VehicleResponseDTO> {
    const profile = await this.getDriverProfileByUserIdOrThrow(userId);
    if (profile.vehicle) {
      throw new AppError(ResponseMessages.VEHICLE_ALREADY_EXISTS, HttpStatusCodes.CONFLICT, 'CONFLICT');
    }

    const existingPlate = await this._driverRepository.findVehicleByPlateNumber(data.plateNumber);
    if (existingPlate) {
      throw new AppError(ResponseMessages.PLATE_NUMBER_TAKEN, HttpStatusCodes.CONFLICT, 'CONFLICT');
    }

    const vehicle = await this._driverRepository.createVehicle(profile.id, data);
    return DriverMapper.toVehicleResponse(vehicle);
  }

  async updateVehicle(userId: string, data: UpdateVehicleDTO): Promise<VehicleResponseDTO> {
    const profile = await this.getDriverProfileByUserIdOrThrow(userId);
    if (!profile.vehicle) {
      throw new AppError(ResponseMessages.VEHICLE_NOT_FOUND, HttpStatusCodes.NOT_FOUND, 'NOT_FOUND');
    }

    if (data.plateNumber && data.plateNumber !== profile.vehicle.plateNumber) {
      const existingPlate = await this._driverRepository.findVehicleByPlateNumber(data.plateNumber);
      if (existingPlate) {
        throw new AppError(ResponseMessages.PLATE_NUMBER_TAKEN, HttpStatusCodes.CONFLICT, 'CONFLICT');
      }
    }

    const vehicle = await this._driverRepository.updateVehicle(profile.id, data);
    return DriverMapper.toVehicleResponse(vehicle);
  }

  async uploadDocuments(userId: string, files: Express.Multer.File[]): Promise<DriverProfileResponseDTO> {
    const profile = await this.getDriverProfileByUserIdOrThrow(userId);
    
    const profileDocs: Record<string, string> = {};
    const vehicleDocs: Record<string, string> = {};

    for (const file of files) {
      const url = `/uploads/${file.filename}`;
      if (file.fieldname === 'profilePhoto') profileDocs.profilePhotoUrl = url;
      if (file.fieldname === 'nationalIdFront') profileDocs.nationalIdFrontUrl = url;
      if (file.fieldname === 'nationalIdBack') profileDocs.nationalIdBackUrl = url;
      if (file.fieldname === 'license') profileDocs.licenseUrl = url;
      
      if (file.fieldname === 'registration' || file.fieldname === 'insurance' || file.fieldname === 'vehiclePhoto') {
        if (!profile.vehicle) {
          throw new AppError('Cannot upload vehicle documents without a registered vehicle', HttpStatusCodes.BAD_REQUEST, 'BAD_REQUEST');
        }
        if (file.fieldname === 'registration') vehicleDocs.registrationUrl = url;
        if (file.fieldname === 'insurance') vehicleDocs.insuranceUrl = url;
        if (file.fieldname === 'vehiclePhoto') vehicleDocs.vehiclePhotoUrl = url;
      }
    }

    let updatedProfile = profile;
    if (Object.keys(profileDocs).length > 0) {
      updatedProfile = await this._driverRepository.updateProfileDocuments(profile.id, profileDocs);
    }
    
    if (Object.keys(vehicleDocs).length > 0 && profile.vehicle) {
      await this._driverRepository.updateVehicleDocuments(profile.vehicle.id, vehicleDocs);
      updatedProfile = await this._driverRepository.findProfileById(profile.id); // reload to get new vehicle data
    }

    return DriverMapper.toDriverProfileResponse(updatedProfile);
  }

  async updateAvailability(userId: string, data: UpdateAvailabilityDTO): Promise<void> {
    const profile = await this.getDriverProfileByUserIdOrThrow(userId);
    
    if (data.availability !== DriverAvailability.OFFLINE) {
      if (profile.verificationStatus !== DriverVerificationStatus.APPROVED) {
        throw new AppError(ResponseMessages.DRIVER_NOT_APPROVED, HttpStatusCodes.FORBIDDEN, 'FORBIDDEN');
      }
      if (!profile.vehicle) {
        throw new AppError(ResponseMessages.VEHICLE_REQUIRED_FOR_ONLINE, HttpStatusCodes.BAD_REQUEST, 'BAD_REQUEST');
      }
    }

    await this._driverRepository.updateAvailability(profile.id, data.availability);

    // Sync with Redis Geo immediately if they go offline
    if (data.availability === DriverAvailability.OFFLINE) {
      await this._locationRepository.removeDriverLocation(profile.id);
    }
    // (If they go online, the actual location will be set via updateLocation)
  }

  async updateLocation(userId: string, data: UpdateLocationDTO): Promise<void> {
    const profile = await this.getDriverProfileByUserIdOrThrow(userId);
    
    if (profile.availability === DriverAvailability.OFFLINE) {
      throw new AppError(ResponseMessages.DRIVER_MUST_BE_ONLINE, HttpStatusCodes.BAD_REQUEST, 'BAD_REQUEST');
    }

    // Always update DB as source of truth
    await this._driverRepository.updateLocation(profile.id, data.latitude, data.longitude);
    
    // Update Redis Geo if healthy
    try {
      await this._locationRepository.setDriverLocation(profile.id, data.latitude, data.longitude);
    } catch (err) {
      logger.error({ err }, 'Failed to update driver location in Redis');
    }
  }

  async getPendingDrivers(): Promise<DriverProfileResponseDTO[]> {
    const profiles = await this._driverRepository.findPendingDrivers();
    return profiles.map(p => DriverMapper.toDriverProfileResponse(p));
  }

  async getDriverDossier(driverProfileId: string): Promise<DriverProfileResponseDTO> {
    const profile = await this._driverRepository.findProfileById(driverProfileId);
    if (!profile) {
      throw new AppError(ResponseMessages.DRIVER_NOT_FOUND, HttpStatusCodes.NOT_FOUND, 'NOT_FOUND');
    }
    return DriverMapper.toDriverProfileResponse(profile);
  }

  async verifyDriver(driverProfileId: string, adminId: string, data: VerifyDriverDTO): Promise<DriverProfileResponseDTO> {
    const profile = await this._driverRepository.findProfileById(driverProfileId);
    if (!profile) {
      throw new AppError(ResponseMessages.DRIVER_NOT_FOUND, HttpStatusCodes.NOT_FOUND, 'NOT_FOUND');
    }

    const updatedProfile = await this._driverRepository.updateVerificationStatus(
      driverProfileId,
      data.decision,
      adminId,
      data.reason
    );

    // If suspended or rejected, they must be knocked offline in Redis
    if (data.decision !== DriverVerificationStatus.APPROVED) {
      await this._locationRepository.removeDriverLocation(driverProfileId);
    }

    return DriverMapper.toDriverProfileResponse(updatedProfile);
  }

  async getNearbyDrivers(query: NearbyDriversQueryDTO): Promise<NearbyDriverResponseDTO[]> {
    if (this._locationRepository.getIsHealthy()) {
      try {
        const geoResults = await this._locationRepository.findNearbyDrivers(
          query.latitude,
          query.longitude,
          query.radiusKm
        );
        
        if (geoResults.length === 0) return [];
        
        // Fetch detailed profiles from DB
        const ids = geoResults.map(r => r.driverProfileId);
        const profiles = await this._driverRepository.findDriversByIds(ids, query.vehicleType);
        
        // Match distance back to profiles and filter out any that went offline between Redis read and DB read
        return profiles.map(profile => {
          const geo = geoResults.find(g => g.driverProfileId === profile.id);
          // Set real-time lat/lng from redis onto profile before mapping
          if (geo) {
            profile.currentLatitude = geo.latitude;
            profile.currentLongitude = geo.longitude;
          }
          return DriverMapper.toNearbyDriverResponse(profile, geo?.distanceKm || 0);
        });
      } catch (err) {
        logger.error({ err }, 'Redis Geo search failed, falling back to DB');
      }
    }
    
    // DB Fallback using Haversine
    const dbResults = await this._driverRepository.findNearbyDrivers(
      query.latitude,
      query.longitude,
      query.radiusKm,
      query.vehicleType
    );
    
    return dbResults.map(row => {
      // It's pre-mapped by the repository's raw query wrapper
      return {
        ...row,
        // distanceKm is already there
      };
    });
  }

  async getPublicDriverDetails(driverProfileId: string): Promise<NearbyDriverResponseDTO> {
    const profile = await this._driverRepository.findProfileById(driverProfileId);
    if (!profile) {
      throw new AppError(ResponseMessages.DRIVER_NOT_FOUND, HttpStatusCodes.NOT_FOUND, 'NOT_FOUND');
    }
    if (profile.verificationStatus !== DriverVerificationStatus.APPROVED) {
      throw new AppError(ResponseMessages.DRIVER_NOT_APPROVED_FOR_SELECTION, HttpStatusCodes.FORBIDDEN, 'FORBIDDEN');
    }
    if (profile.availability === DriverAvailability.OFFLINE) {
      throw new AppError(ResponseMessages.DRIVER_UNAVAILABLE, HttpStatusCodes.BAD_REQUEST, 'BAD_REQUEST');
    }
    // distance is irrelevant here
    return DriverMapper.toNearbyDriverResponse(profile, 0);
  }
}
