import { ITripRepository } from '../interfaces/ITripRepository.js';
import { logger } from '../../../common/utils/logger.js';

export class TripExpirationService {
  private _intervalId?: NodeJS.Timeout;

  constructor(
    private readonly _tripRepository: ITripRepository,
    private readonly _intervalMs: number = 10000 // default 10 seconds
  ) {}

  start() {
    if (this._intervalId) return;

    logger.info(`Starting TripExpirationService (Interval: ${this._intervalMs}ms)`);
    this._intervalId = setInterval(async () => {
      try {
        const expiredCount = await this._tripRepository.expirePendingTrips(new Date());
        if (expiredCount > 0) {
          logger.info(`TripExpirationService: Expired ${expiredCount} trips`);
        }
      } catch (error) {
        logger.error({ err: error }, 'TripExpirationService: Error expiring trips');
      }
    }, this._intervalMs);
  }

  stop() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = undefined;
      logger.info('TripExpirationService stopped');
    }
  }
}
