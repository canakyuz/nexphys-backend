// src/config/env.config.ts - Environment loading düzeltmesi
import { config } from 'dotenv';
import path from 'path';

// Load environment based on NODE_ENV or explicit file
const envFile = process.env.ENV_FILE || '.env';
const result = config({ path: path.resolve(process.cwd(), envFile) });

if (result.error) {
  // Could not load env file, falling back to default .env
  config(); // Fallback to default .env
}


export const envConfig = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000'),
  API_PREFIX: process.env.API_PREFIX || '/api/v1',

  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  DB_NAME: process.env.DB_NAME || 'nexphys_db',
  DB_USER: process.env.DB_USER || 'nexphys_user',
  DB_PASSWORD: process.env.DB_PASSWORD || 'nexphys123',

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'nexphys-development-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'nexphys-refresh-secret',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:4000'],
  CORS_CREDENTIALS: process.env.CORS_CREDENTIALS === 'true',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100'),

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',

  // Tenant
  DEFAULT_TENANT_SCHEMA_PREFIX: process.env.DEFAULT_TENANT_SCHEMA_PREFIX || 'tenant_',
  MAX_TENANTS_PER_DATABASE: parseInt(process.env.MAX_TENANTS_PER_DATABASE || '1000'),
  TENANT_TRIAL_DAYS: parseInt(process.env.TENANT_TRIAL_DAYS || '30'),
  AUTO_CREATE_TENANT_SCHEMA: process.env.AUTO_CREATE_TENANT_SCHEMA === 'true',

  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  PASSWORD_MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),

  // Pagination
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE || '20'),
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE || '100'),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  LOG_FORMAT: process.env.LOG_FORMAT || 'combined',
};

// Debug log current config - using proper logger instead of console.log
if (envConfig.NODE_ENV === 'development') {
  // Environment loaded successfully - use proper logging in production
}