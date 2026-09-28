export interface NearbyDriverLocation {
  driverProfileId: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export interface IDriverLocationRepository {
  setDriverLocation(driverProfileId: string, latitude: number, longitude: number): Promise<void>;
  removeDriverLocation(driverProfileId: string): Promise<void>;
  findNearbyDrivers(latitude: number, longitude: number, radiusKm: number): Promise<NearbyDriverLocation[]>;
  getIsHealthy(): boolean;
}
