// src/shared/database/config/public-connection.ts
import { DataSource } from 'typeorm';
import { envConfig } from '@/config/env.config';
import { Tenant, Subscription } from '../entities/public';

export const PublicDataSource = new DataSource({
  type: 'postgres',
  host: envConfig.DB_HOST,
  port: envConfig.DB_PORT,
  username: envConfig.DB_USER,
  password: envConfig.DB_PASSWORD,
  database: envConfig.DB_NAME,
  schema: 'public',

  // Entities
  entities: [Tenant, Subscription],

  // Migrations
  migrations: ['src/shared/database/migrations/public/*.ts'],

  // Development settings
  synchronize: envConfig.NODE_ENV === 'development',
  logging: envConfig.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],

  // Connection pool settings
  extra: {
    max: 20,
    min: 5,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
  },

  // SSL settings for production
  ssl: envConfig.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,

  // Metadata
  metadataTableName: 'typeorm_metadata',
  migrationsTableName: 'typeorm_migrations',

  // Cache settings
  cache: envConfig.NODE_ENV === 'production' ? {
    duration: 30000 // 30 seconds
  } : false,
});

// Initialize connection on first import
export const initializePublicConnection = async (): Promise<void> => {
  try {
    if (!PublicDataSource.isInitialized) {
      await PublicDataSource.initialize();
      console.log('✅ Public database connection established');
    }
  } catch (error) {
    console.error('❌ Public database connection failed:', error);
    throw error;
  }
};

// Graceful shutdown
export const closePublicConnection = async (): Promise<void> => {
  try {
    if (PublicDataSource.isInitialized) {
      await PublicDataSource.destroy();
      console.log('✅ Public database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing public database connection:', error);
    throw error;
  }
};