import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import path from 'path';
import { env } from './config/env.js';
import { logger } from './common/utils/logger.js';
import { ApiRoutes } from './common/constants/ApiRoutes.js';
import { HttpStatusCodes } from './common/constants/HttpStatusCodes.js';
import { ResponseMessages } from './common/constants/ResponseMessages.js';
import { AppConstants } from './common/constants/AppConstants.js';
import { ApiResponseBuilder } from './common/utils/ApiResponse.js';
import { errorHandler } from './common/middleware/errorHandler.js';
import { createContainer, AppContainer } from './composition-root.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createRoleTestRouter } from './modules/roles/role-test.routes.js';
import { createDriverRouter } from './modules/driver/driver.routes.js';
import { createAdminDriverRouter } from './modules/driver/admin-driver.routes.js';
import { createCustomerDriverRouter } from './modules/driver/customer-driver.routes.js';
import { isRedisReady } from './config/redis.js';

export const createApp = (container: AppContainer = createContainer()): Express => {
  const app: Express = express();

  // Security Middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow images to be loaded cross-origin
  }));
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body Parsing Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static File Serving for Uploads
  app.use(`/${AppConstants.UPLOADS_DIR}`, express.static(path.resolve(process.cwd(), AppConstants.UPLOADS_DIR)));

  // HTTP Request Logging
  if (env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
        autoLogging: {
          ignore: (req) => req.url === ApiRoutes.HEALTH,
        },
      })
    );
  }

  // Health Check Endpoint
  app.get(ApiRoutes.HEALTH, (_req, res) => {
    res.status(HttpStatusCodes.OK).json(
      ApiResponseBuilder.success({
        status: 'UP',
        service: 'shaddad-backend',
        environment: env.NODE_ENV,
        redis: isRedisReady() ? 'CONNECTED' : 'DEGRADED',
        timestamp: new Date().toISOString(),
      })
    );
  });

  // Mount API Routers under /api/v1
  const apiRouter = express.Router();
  apiRouter.use(
    ApiRoutes.AUTH.ROOT,
    createAuthRouter(container.authController, container.tokenService)
  );
  
  // Driver Routes
  apiRouter.use(
    ApiRoutes.DRIVER.ROOT,
    createDriverRouter(container.driverController, container.tokenService)
  );

  // Admin Routes (for driver verification etc)
  apiRouter.use(
    ApiRoutes.ADMIN.ROOT,
    createAdminDriverRouter(container.adminDriverController, container.tokenService)
  );

  // Customer Routes (for nearby drivers etc)
  apiRouter.use(
    ApiRoutes.CUSTOMER.ROOT,
    createCustomerDriverRouter(container.customerDriverController, container.tokenService)
  );

  apiRouter.use('/roles', createRoleTestRouter(container.tokenService));

  app.use(ApiRoutes.BASE_V1, apiRouter);

  // 404 Route Handler
  app.use((_req, res) => {
    res
      .status(HttpStatusCodes.NOT_FOUND)
      .json(
        ApiResponseBuilder.error(
          'ROUTE_NOT_FOUND',
          ResponseMessages.ROUTE_NOT_FOUND
        )
      );
  });

  // Global Error Handler Middleware
  app.use(errorHandler);

  return app;
};
