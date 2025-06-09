import { DataSource } from 'typeorm';
import { envConfig } from '@/config/env.config';
import { PublicDataSource } from '@/shared/database/config/public-connection';
import { logger } from '@/shared/utils/logger.util';

// Yeni veritabanı mimarisine uygun sabitler
export const SCHEMA_TYPES = {
  SYS: 'sys',
  COMMON: 'common',
  TENANT: 'tenant'
};

// Şema adı oluşturma
export const createSchemaName = (domain: string, schemaType: string): string => {
  // Sistem şemaları
  if (schemaType === SCHEMA_TYPES.SYS || schemaType === SCHEMA_TYPES.COMMON) {
    return schemaType;
  }
  
  // Tenant şeması
  const cleanDomain = domain.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `tenant_${cleanDomain}`;
};

// Şema varlığını kontrol etme
export const schemaExists = async (schemaName: string): Promise<boolean> => {
  try {
    const result = await PublicDataSource.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      [schemaName]
    );
    return result.length > 0;
  } catch (error) {
    logger.error(`Error checking schema existence for ${schemaName}:`, error);
    return false;
  }
};

// Şema oluşturma
export const createSchema = async (schemaName: string): Promise<boolean> => {
  try {
    await PublicDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    logger.info(`Schema created: ${schemaName}`);
    return true;
  } catch (error) {
    logger.error(`Error creating schema ${schemaName}:`, error);
    return false;
  }
};

// Şema silme
export const dropSchema = async (schemaName: string): Promise<boolean> => {
  try {
    await PublicDataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    logger.info(`Schema dropped: ${schemaName}`);
    return true;
  } catch (error) {
    logger.error(`Error dropping schema ${schemaName}:`, error);
    return false;
  }
};

// Şema için DataSource oluşturma
export const createDataSource = (schemaName: string): DataSource => {
  return new DataSource({
    type: 'postgres',
    host: envConfig.DB_HOST,
    port: envConfig.DB_PORT,
    username: envConfig.DB_USER,
    password: envConfig.DB_PASSWORD,
    database: envConfig.DB_NAME,
    schema: schemaName,
    
    // Entitiler ve migrasyonlar şema tipine göre dinamik olarak belirlenecek
    entities: [],
    migrations: [],
    
    // Geliştirme ayarları
    synchronize: false, // Her zaman migrationları kullan
    logging: envConfig.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    
    // Bağlantı havuzu ayarları
    extra: {
      max: 10,
      min: 2,
      idleTimeoutMillis: 40000,
    },
    
    // SSL ayarları
    ssl: envConfig.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
  });
};

// Tenant şemasını oluşturma
export const createTenantSchema = async (domain: string): Promise<string | null> => {
  const schemaName = createSchemaName(domain, SCHEMA_TYPES.TENANT);
  const success = await createSchema(schemaName);
  
  if (success) {
    return schemaName;
  }
  
  return null;
};

// Tenant şemasını silme
export const dropTenantSchema = async (domain: string): Promise<boolean> => {
  const schemaName = createSchemaName(domain, SCHEMA_TYPES.TENANT);
  return await dropSchema(schemaName);
};

// Tenant varlığını kontrol etme
export const tenantExists = async (domain: string): Promise<boolean> => {
  try {
    const result = await PublicDataSource.query(
      `SELECT * FROM sys.tenants WHERE domain = $1`,
      [domain]
    );
    return result.length > 0;
  } catch (error) {
    logger.error(`Error checking tenant existence for ${domain}:`, error);
    return false;
  }
}; 