import { CreateVehicleDTO } from '../dtos/CreateVehicleDTO.js';
import { UpdateVehicleDTO } from '../dtos/UpdateVehicleDTO.js';
import { UpdateAvailabilityDTO } from '../dtos/UpdateAvailabilityDTO.js';
import { UpdateLocationDTO } from '../dtos/UpdateLocationDTO.js';
import { VerifyDriverDTO } from '../dtos/VerifyDriverDTO.js';
import { NearbyDriversQueryDTO } from '../dtos/NearbyDriversQueryDTO.js';
import { DriverProfileResponseDTO, VehicleResponseDTO, NearbyDriverResponseDTO } from '../dtos/DriverResponses.js';

export interface IDriverService {
  // Driver self-actions
  getProfile(userId: string): Promise<DriverProfileResponseDTO>;
  
  getVehicle(userId: string): Promise<VehicleResponseDTO>;
  createVehicle(userId: string, data: CreateVehicleDTO): Promise<VehicleResponseDTO>;
  updateVehicle(userId: string, data: UpdateVehicleDTO): Promise<VehicleResponseDTO>;
  
  uploadDocuments(userId: string, files: Express.Multer.File[]): Promise<DriverProfileResponseDTO>;
  
  updateAvailability(userId: string, data: UpdateAvailabilityDTO): Promise<void>;
  updateLocation(userId: string, data: UpdateLocationDTO): Promise<void>;
  
  // Admin actions
  getPendingDrivers(): Promise<DriverProfileResponseDTO[]>;
  getDriverDossier(driverProfileId: string): Promise<DriverProfileResponseDTO>;
  verifyDriver(driverProfileId: string, adminId: string, data: VerifyDriverDTO): Promise<DriverProfileResponseDTO>;
  
  // Customer actions
  getNearbyDrivers(query: NearbyDriversQueryDTO): Promise<NearbyDriverResponseDTO[]>;
  getPublicDriverDetails(driverProfileId: string): Promise<NearbyDriverResponseDTO>;
}
