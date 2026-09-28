import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from '../common/utils/logger.js';

let redisClient: Redis | null = null;
let isRedisConnected = false;

export const getRedisClient = (): Redis | null => {
  if (!redisClient && env.REDIS_URL) {
    try {
      redisClient = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
          if (times > 3) {
            logger.warn('⚠️ Redis connection attempts exceeded. Proceeding with degraded cache mode.');
            return null;
          }
          return Math.min(times * 100, 2000);
        },
        lazyConnect: true,
      });

      redisClient.on('connect', () => {
        isRedisConnected = true;
        logger.info(' Connected to Redis successfully');
      });

      redisClient.on('error', (err) => {
        isRedisConnected = false;
        logger.warn({ err: err.message }, '⚠️ Redis connection error');
      });
    } catch (error) {
      logger.warn({ err: error }, '⚠️ Redis client initialization failed');
    }
  }

  return redisClient;
};

export const connectRedis = async (): Promise<boolean> => {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.connect();
    isRedisConnected = true;
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn({ err: message }, '⚠️ Redis offline - caching will be bypassed');
    isRedisConnected = false;
    return false;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit().catch(() => {});
    isRedisConnected = false;
    logger.info(' Disconnected from Redis');
  }
};

export const isRedisReady = (): boolean => isRedisConnected;
