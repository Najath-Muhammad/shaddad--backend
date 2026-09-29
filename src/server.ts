import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './common/utils/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRedis, disconnectRedis } from './config/redis.js';

const startServer = async (): Promise<http.Server> => {
  try {
    // 1. Initialize Database connection
    await connectDatabase();

    // 2. Initialize Redis connection (non-blocking fallback)
    await connectRedis();

    // 3. Create Express application
    const app = createApp();

    // 4. Start HTTP Server
    const server = http.createServer(app);

    // 5. Initialize Socket.IO Server
    const { tokenService } = app.locals.container;
    const { prisma } = await import('./config/database.js');
    const { SocketServer } = await import('./modules/realtime/SocketServer.js');
    new SocketServer(server, prisma, tokenService);

    server.listen(env.PORT, () => {
      logger.info(`🚀 SHADDAD Backend Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful Shutdown
    const handleShutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await disconnectDatabase();
        await disconnectRedis();
        process.exit(0);
      });

      // Force exit after 10 seconds if graceful shutdown hangs
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

    return server;
  } catch (error) {
    logger.error({ err: error }, '❌ Fatal server startup error');
    process.exit(1);
  }
};

void startServer();
