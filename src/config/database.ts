import { PrismaClient } from '@prisma/client';
import { logger } from '../common/utils/logger.js';

let prismaInstance: PrismaClient | null = null;

export const getPrismaClient = (): PrismaClient => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log:
        process.env.NODE_ENV === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'error' },
              { emit: 'stdout', level: 'warn' },
            ]
          : [{ emit: 'stdout', level: 'error' }],
    });

    if (process.env.NODE_ENV === 'development') {
      // Log queries in development
      (prismaInstance as unknown as { $on: (event: string, callback: (e: { query: string }) => void) => void }).$on(
        'query',
        (e: { query: string }) => {
          logger.debug({ query: e.query }, 'Prisma Query');
        }
      );
    }
  }

  return prismaInstance;
};

export const prisma = getPrismaClient();

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info(' Connected to PostgreSQL database via Prisma');
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to connect to PostgreSQL database');
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    logger.info(' Disconnected from PostgreSQL database');
  }
};
