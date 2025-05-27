// src/server.ts - Database initialization düzeltmesi
import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { envConfig } from '@/config/env.config';
import { corsMiddleware } from '@/shared/middlewares/cors.middleware';
import { errorHandler, notFoundHandler } from '@/shared/middlewares/error.middleware';
import { logger } from '@/shared/utils/logger.util';
import { PublicDataSource, closePublicConnection, closeAllTenantConnections } from '@/shared/database/config';
import { ResponseUtil } from '@/shared/utils/response.util';

// Routes
import { tenantRoutes } from '@/modules/tenants/routes/tenant.routes';
import { authRoutes } from '@/modules/auth/routes/auth.routes';
import { userRoutes } from '@/modules/users/routes/user.routes';
import { roleRoutes } from '@/modules/roles/routes/role.routes';

class Server {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      logger.info('📊 Attempting to connect to database...');
      logger.info(`📊 Database config: ${envConfig.DB_HOST}:${envConfig.DB_PORT}/${envConfig.DB_NAME}`);

      if (!PublicDataSource.isInitialized) {
        await PublicDataSource.initialize();
      }

      logger.info('✅ Public database connection established successfully');

      // Test database connection
      await PublicDataSource.query('SELECT NOW() as current_time, version() as pg_version');
      logger.info('✅ Database connection test successful');

    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      logger.error('💡 Make sure PostgreSQL is running with correct credentials');
      logger.error('🐳 Try: docker-compose up -d postgres');

      // In development, don't exit - allow server to start without DB for debugging
      if (envConfig.NODE_ENV === 'development') {
        logger.warn('⚠️  Starting server without database connection (development mode)');
      } else {
        process.exit(1);
      }
    }
  }

  private initializeMiddlewares() {
    // Security
    this.app.use(helmet());
    this.app.use(compression());

    // CORS
    this.app.use(corsMiddleware);

    // Logging
    this.app.use(morgan(envConfig.LOG_FORMAT));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: envConfig.RATE_LIMIT_WINDOW_MS,
      max: envConfig.RATE_LIMIT_MAX,
      message: 'Too many requests from this IP',
    });
    this.app.use(limiter);
  }

  private initializeRoutes() {
    // Health check
    this.app.get('/health', async (req, res) => {
      const dbStatus = PublicDataSource.isInitialized ? 'connected' : 'disconnected';
      let dbVersion = 'unknown';

      try {
        if (PublicDataSource.isInitialized) {
          const result = await PublicDataSource.query('SELECT version() as version');
          dbVersion = result[0]?.version?.split(' ')[1] || 'unknown';
        }
      } catch (error) {
        logger.error('Health check database query failed:', error);
      }

      ResponseUtil.success(res, {
        status: 'OK',
        database: {
          status: dbStatus,
          version: dbVersion,
          host: envConfig.DB_HOST,
          port: envConfig.DB_PORT,
          name: envConfig.DB_NAME
        },
        timestamp: new Date().toISOString(),
        environment: envConfig.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
      }, 'nexphys API is running');
    });

    // API routes
    this.app.use(`${envConfig.API_PREFIX}/tenants`, tenantRoutes);
    this.app.use(`${envConfig.API_PREFIX}/auth`, authRoutes);
    this.app.use(`${envConfig.API_PREFIX}/users`, userRoutes);
    this.app.use(`${envConfig.API_PREFIX}/roles`, roleRoutes);
  }

  private initializeErrorHandling() {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public start() {
    this.app.listen(envConfig.PORT, () => {
      logger.info('🚀 ================================');
      logger.info(`🚀 nexphys API Server Started`);
      logger.info(`🚀 ================================`);
      logger.info(`📖 Environment: ${envConfig.NODE_ENV}`);
      logger.info(`🌐 API URL: http://localhost:${envConfig.PORT}${envConfig.API_PREFIX}`);
      logger.info(`📊 Database: ${envConfig.DB_HOST}:${envConfig.DB_PORT}/${envConfig.DB_NAME}`);
      logger.info(`🔍 Health Check: http://localhost:${envConfig.PORT}/health`);
      logger.info('🚀 ================================');
    });
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);

  try {
    // Close all database connections
    await closeAllTenantConnections();
    await closePublicConnection();

    logger.info('✅ All database connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start server
const server = new Server();
server.start();