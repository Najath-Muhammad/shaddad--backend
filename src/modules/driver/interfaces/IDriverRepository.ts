import { CreateVehicleDTO } from '../dtos/CreateVehicleDTO.js';
import { UpdateVehicleDTO } from '../dtos/UpdateVehicleDTO.js';
import { DriverVerificationStatusType } from '../../../common/constants/AppConstants.js';

export interface IDriverRepository {
  findProfileById(id: string): Promise<any | null>;
  findProfileByUserId(userId: string): Promise<any | null>;
  
  findVehicleByDriverProfileId(driverProfileId: string): Promise<any | null>;
  findVehicleByPlateNumber(plateNumber: string): Promise<any | null>;
  
  createVehicle(driverProfileId: string, data: CreateVehicleDTO): Promise<any>;
  updateVehicle(driverProfileId: string, data: UpdateVehicleDTO): Promise<any>;
  
  updateProfileDocuments(driverProfileId: string, documents: Record<string, string>): Promise<any>;
  updateVehicleDocuments(vehicleId: string, documents: Record<string, string>): Promise<any>;
  
  updateAvailability(driverProfileId: string, availability: string): Promise<any>;
  updateLocation(driverProfileId: string, latitude: number, longitude: number): Promise<any>;
  
  findPendingDrivers(): Promise<any[]>;
  updateVerificationStatus(driverProfileId: string, status: DriverVerificationStatusType, adminId: string, reason?: string): Promise<any>;
  
  // Database fallback for geospatial search
  findNearbyDrivers(latitude: number, longitude: number, radiusKm: number, vehicleType?: string): Promise<any[]>;
  findDriversByIds(ids: string[], vehicleType?: string): Promise<any[]>;
}
