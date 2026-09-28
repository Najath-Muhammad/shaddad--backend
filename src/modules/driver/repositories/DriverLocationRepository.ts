import Redis from 'ioredis';
import { IDriverLocationRepository, NearbyDriverLocation } from '../interfaces/IDriverLocationRepository.js';
import { isRedisReady } from '../../../config/redis.js';
import { logger } from '../../../common/utils/logger.js';

export class DriverLocationRepository implements IDriverLocationRepository {
  private readonly _geoKey = 'shaddad:drivers:online';

  constructor(private readonly _redis: Redis | null) {}

  getIsHealthy(): boolean {
    return isRedisReady();
  }

  async setDriverLocation(driverProfileId: string, latitude: number, longitude: number): Promise<void> {
    if (!this.getIsHealthy() || !this._redis) {
      logger.warn('Redis is not available, skipping fast geo location update');
      return;
    }
    await this._redis.geoadd(this._geoKey, longitude, latitude, driverProfileId);
  }

  async removeDriverLocation(driverProfileId: string): Promise<void> {
    if (!this.getIsHealthy() || !this._redis) return;
    await this._redis.zrem(this._geoKey, driverProfileId);
  }

  async findNearbyDrivers(latitude: number, longitude: number, radiusKm: number): Promise<NearbyDriverLocation[]> {
    if (!this.getIsHealthy() || !this._redis) {
      throw new Error('Redis not available for fast geosearch');
    }

    // Returns array of arrays: [ [ 'driverId1', '1.5', [lng, lat] ], ... ]
    const results = await this._redis.geosearch(
      this._geoKey,
      'FROMLONLAT', longitude, latitude,
      'BYRADIUS', radiusKm, 'km',
      'WITHDIST', 'WITHCOORD', 'ASC'
    ) as any[];

    return results.map(res => ({
      driverProfileId: res[0],
      distanceKm: parseFloat(res[1]),
      longitude: parseFloat(res[2][0]),
      latitude: parseFloat(res[2][1]),
    }));
  }
}
