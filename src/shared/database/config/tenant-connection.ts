// src/shared/database/config/tenant-connection.ts
import { DataSource } from 'typeorm';
import { envConfig } from '@/config/env.config';
import { User, Role, RoleType, Permission } from '../entities/tenant';

// Cache for tenant connections
const tenantConnections = new Map<string, DataSource>();

export const createTenantDataSource = (schemaName: string): DataSource => {
  return new DataSource({
    type: 'postgres',
    host: envConfig.DB_HOST,
    port: envConfig.DB_PORT,
    username: envConfig.DB_USER,
    password: envConfig.DB_PASSWORD,
    database: envConfig.DB_NAME,
    schema: schemaName,

    // Entities
    entities: [User, Role, RoleType, Permission],

    // Migrations
    migrations: ['src/shared/database/migrations/tenant/*.ts'],

    // Development settings
    synchronize: false, // Always use migrations for tenant schemas
    logging: envConfig.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],

    // Connection pool settings (smaller for tenant connections)
    extra: {
      max: 10,
      min: 2,
      acquireTimeoutMillis: 40000,
      idleTimeoutMillis: 40000,
      reapIntervalMillis: 1000,
    },

    // SSL settings for production
    ssl: envConfig.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,

    // Metadata (per schema)
    metadataTableName: 'typeorm_metadata',
    migrationsTableName: 'typeorm_migrations',
  });
};

// Get or create cached tenant connection
export const getTenantConnection = async (schemaName: string): Promise<DataSource> => {
  if (tenantConnections.has(schemaName)) {
    const connection = tenantConnections.get(schemaName)!;
    if (connection.isInitialized) {
      return connection;
    }
  }

  const dataSource = createTenantDataSource(schemaName);
  await dataSource.initialize();
  tenantConnections.set(schemaName, dataSource);

  return dataSource;
};

// Close specific tenant connection
export const closeTenantConnection = async (schemaName: string): Promise<void> => {
  const connection = tenantConnections.get(schemaName);
  if (connection && connection.isInitialized) {
    await connection.destroy();
    tenantConnections.delete(schemaName);
  }
};

// Close all tenant connections
export const closeAllTenantConnections = async (): Promise<void> => {
  const closePromises = Array.from(tenantConnections.entries()).map(
    async ([schemaName, connection]) => {
      if (connection.isInitialized) {
        await connection.destroy();
      }
    }
  );

  await Promise.all(closePromises);
  tenantConnections.clear();
};

// For TypeORM CLI - default tenant connection
const defaultTenantSchema = envConfig.DEFAULT_TENANT_SCHEMA_PREFIX + 'default';
export default createTenantDataSource(defaultTenantSchema);