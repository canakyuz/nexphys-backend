import { DataSource, DataSourceOptions } from 'typeorm';
import * as Logger from './logger';
import {
  SCHEMA_TYPES,
  createSchemaName,
  schemaExists,
  createSchema,
  createDataSource
} from './db';

// PostgreSQL için özel tip tanımlaması
interface PostgresOptions extends DataSourceOptions {
  schema?: string;
}

// Güvenli bir şekilde entity yükleme
const safeRequire = (path: string) => {
  try {
    return require(path);
  } catch (error) {
    Logger.logWarning(`Entity import failed: ${path}`);
    return null;
  }
};

// Şema bazlı entity çözümleme
export const getEntitiesForSchema = (schemaType: string): any[] => {
  const entities: any[] = [];
  
  switch (schemaType) {
    case SCHEMA_TYPES.SYS:
      // sys şeması için entitiler
      try {
        const { Tenant } = require('../../shared/database/entities/sys/tenant.entity');
        const { Subscription } = require('../../shared/database/entities/sys/subscription.entity');
        
        if (Tenant) entities.push(Tenant);
        if (Subscription) entities.push(Subscription);
      } catch (error: any) {
        Logger.logWarning(`Failed to load SYS entities: ${error?.message || 'Unknown error'}`);
      }
      break;
    
    case SCHEMA_TYPES.COMMON:
      // common şeması için entitiler
      try {
        const { Exercise } = require('../../shared/database/entities/common/exercise.entity');
        const { Nutrition } = require('../../shared/database/entities/common/nutrition.entity');
        
        if (Exercise) entities.push(Exercise);
        if (Nutrition) entities.push(Nutrition);
      } catch (error: any) {
        Logger.logWarning(`Failed to load COMMON entities: ${error?.message || 'Unknown error'}`);
      }
      break;
    
    case SCHEMA_TYPES.TENANT:
      // tenant şeması için tüm entitiler - gruplar halinde yükle
      // Auth
      try {
        const { User } = require('../../shared/database/entities/tenant/user.entity');
        const { Role } = require('../../shared/database/entities/tenant/role.entity');
        const { Permission } = require('../../shared/database/entities/tenant/permission.entity');
        
        if (User) entities.push(User);
        if (Role) entities.push(Role);
        if (Permission) entities.push(Permission);
      } catch (error: any) {
        Logger.logWarning(`Failed to load Auth entities: ${error?.message || 'Unknown error'}`);
      }
      
      // CRM
      try {
        const { Member } = require('../../shared/database/entities/tenant/member.entity');
        const { Contact } = require('../../shared/database/entities/tenant/contact.entity');
        
        if (Member) entities.push(Member);
        if (Contact) entities.push(Contact);
      } catch (error: any) {
        Logger.logWarning(`Failed to load CRM entities: ${error?.message || 'Unknown error'}`);
      }
      
      // Business
      try {
        const { Subscription } = require('../../shared/database/entities/tenant/subscription.entity');
        const { Payment } = require('../../shared/database/entities/tenant/payment.entity');
        const { Invoice } = require('../../shared/database/entities/tenant/invoice.entity');
        
        if (Subscription) entities.push(Subscription);
        if (Payment) entities.push(Payment);
        if (Invoice) entities.push(Invoice);
      } catch (error: any) {
        Logger.logWarning(`Failed to load Business entities: ${error?.message || 'Unknown error'}`);
      }
      
      // Diğer modüller için benzer yapı uygulanabilir
      break;
    
    default:
      return [];
  }
  
  return entities.filter(entity => entity !== null);
};

// Şema bazlı migration klasörü çözümleme
export const getMigrationDirForSchema = (schemaType: string): string => {
  if (schemaType === SCHEMA_TYPES.SYS || schemaType === SCHEMA_TYPES.COMMON) {
    return `src/shared/database/migrations/${schemaType}`;
  }
  
  return `src/shared/database/migrations/tenant`;
};

// Şema oluşturma ve hazırlama
export const setupSchema = async (
  domain: string,
  schemaType: string
): Promise<DataSource | null> => {
  try {
    const schemaName = createSchemaName(domain, schemaType);
    
    // Şema var mı kontrol et
    const exists = await schemaExists(schemaName);
    
    if (!exists) {
      // Şema oluştur
      const created = await createSchema(schemaName);
      
      if (!created) {
        Logger.logError(`Failed to create schema: ${schemaName}`);
        return null;
      }
      
      Logger.logInfo(`Created schema: ${schemaName}`);
    } else {
      Logger.logInfo(`Schema already exists: ${schemaName}`);
    }
    
    // DataSource oluştur
    const dataSource = createDataSource(schemaName);
    
    // Şema tipine göre entitileri ve migrasyonları ayarla
    const entities = getEntitiesForSchema(schemaType);
    const migrationDir = getMigrationDirForSchema(schemaType);
    
    // DataSource'a entity ve migrasyon bilgilerini ekle
    Object.assign(dataSource.options, {
      entities,
      migrations: [`${migrationDir}/*.ts`]
    });
    
    // DataSource'u başlat
    await dataSource.initialize();
    Logger.logInfo(`DataSource initialized for schema: ${schemaName}`);
    
    return dataSource;
  } catch (error: any) {
    Logger.logError(`Error setting up schema for ${domain} (${schemaType}): ${error?.message || 'Unknown error'}`);
    return null;
  }
};

// Şema için migrasyon çalıştırma
export const runMigrations = async (dataSource: DataSource): Promise<boolean> => {
  try {
    const migrations = await dataSource.runMigrations();
    const schemaName = getSchemaNameSafely(dataSource);
    Logger.logInfo(`Ran ${migrations.length} migrations for schema: ${schemaName}`);
    
    return true;
  } catch (error: any) {
    const schemaName = getSchemaNameSafely(dataSource);
    Logger.logError(`Error running migrations for schema ${schemaName}: ${error?.message || 'Unknown error'}`);
    return false;
  }
};

// Şema için son migrasyonu geri alma
export const revertMigration = async (dataSource: DataSource): Promise<boolean> => {
  try {
    await dataSource.undoLastMigration();
    const schemaName = getSchemaNameSafely(dataSource);
    Logger.logInfo(`Reverted last migration for schema: ${schemaName}`);
    
    return true;
  } catch (error: any) {
    const schemaName = getSchemaNameSafely(dataSource);
    Logger.logError(`Error reverting migration for schema ${schemaName}: ${error?.message || 'Unknown error'}`);
    return false;
  }
};

// Şema adını güvenli bir şekilde al
function getSchemaNameSafely(dataSource: DataSource): string {
  try {
    // TypeORM seçeneklerini any olarak ele al
    const options = dataSource.options as any;
    return options.schema || 'unknown';
  } catch (error) {
    return 'unknown';
  }
} 