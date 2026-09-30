import { CreateVehicleDTO } from '../dtos/CreateVehicleDTO.js';
import { UpdateVehicleDTO } from '../dtos/UpdateVehicleDTO.js';
import { DriverVerificationStatusType } from '../../../common/constants/AppConstants.js';

export interface IDriverRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findProfileById(id: string): Promise<any | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findProfileByUserId(userId: string): Promise<any | null>;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findVehicleByDriverProfileId(driverProfileId: string): Promise<any | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findVehicleByPlateNumber(plateNumber: string): Promise<any | null>;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createVehicle(driverProfileId: string, data: CreateVehicleDTO): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateVehicle(driverProfileId: string, data: UpdateVehicleDTO): Promise<any>;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProfileDocuments(driverProfileId: string, documents: Record<string, string>): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateVehicleDocuments(vehicleId: string, documents: Record<string, string>): Promise<any>;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateAvailability(driverProfileId: string, availability: string): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateLocation(driverProfileId: string, latitude: number, longitude: number): Promise<any>;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findPendingDrivers(): Promise<any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateVerificationStatus(driverProfileId: string, status: DriverVerificationStatusType, adminId: string, reason?: string): Promise<any>;
  
  // Database fallback for geospatial search
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findNearbyDrivers(latitude: number, longitude: number, radiusKm: number, vehicleType?: string): Promise<any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findDriversByIds(ids: string[], vehicleType?: string): Promise<any[]>;
}
