import { DataSource } from 'typeorm';
import { logger } from '@/shared/utils/logger.util';
import {
  SCHEMA_TYPES,
  createSchemaName,
  schemaExists,
  createSchema,
  createDataSource
} from './db';

// Şema bazlı entity çözümleme
export const getEntitiesForSchema = (schemaType: string): any[] => {
  switch (schemaType) {
    case SCHEMA_TYPES.SYS:
      // sys şeması için entitiler
      return [
        require('@/shared/database/entities/sys/tenant.entity').Tenant,
        require('@/shared/database/entities/sys/subscription.entity').Subscription
      ];
    
    case SCHEMA_TYPES.COMMON:
      // common şeması için entitiler
      return [
        require('@/shared/database/entities/common/exercise.entity').Exercise,
        require('@/shared/database/entities/common/nutrition.entity').Nutrition
      ];
    
    case SCHEMA_TYPES.TENANT:
      // tenant şeması için tüm entitiler
      return [
        // Auth
        require('@/shared/database/entities/tenant/user.entity').User,
        require('@/shared/database/entities/tenant/role.entity').Role,
        require('@/shared/database/entities/tenant/permission.entity').Permission,
        
        // CRM
        require('@/shared/database/entities/tenant/member.entity').Member,
        require('@/shared/database/entities/tenant/contact.entity').Contact,
        
        // Business
        require('@/shared/database/entities/tenant/subscription.entity').Subscription,
        require('@/shared/database/entities/tenant/payment.entity').Payment,
        require('@/shared/database/entities/tenant/invoice.entity').Invoice,
        
        // Facilities
        require('@/shared/database/entities/tenant/location.entity').Location,
        require('@/shared/database/entities/tenant/room.entity').Room,
        require('@/shared/database/entities/tenant/equipment.entity').Equipment,
        
        // Schedule
        require('@/shared/database/entities/tenant/class.entity').Class,
        require('@/shared/database/entities/tenant/appointment.entity').Appointment,
        require('@/shared/database/entities/tenant/attendance.entity').Attendance,
        
        // Fitness
        require('@/shared/database/entities/tenant/workout.entity').Workout,
        require('@/shared/database/entities/tenant/program.entity').Program,
        require('@/shared/database/entities/tenant/measurement.entity').Measurement,
        
        // Operations
        require('@/shared/database/entities/tenant/task.entity').Task,
        require('@/shared/database/entities/tenant/notification.entity').Notification,
        require('@/shared/database/entities/tenant/settings.entity').Settings
      ];
    
    default:
      return [];
  }
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
        logger.error(`Failed to create schema: ${schemaName}`);
        return null;
      }
      
      logger.info(`Created schema: ${schemaName}`);
    } else {
      logger.info(`Schema already exists: ${schemaName}`);
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
    logger.info(`DataSource initialized for schema: ${schemaName}`);
    
    return dataSource;
  } catch (error) {
    logger.error(`Error setting up schema for ${domain} (${schemaType}):`, error);
    return null;
  }
};

// Şema için migrasyon çalıştırma
export const runMigrations = async (dataSource: DataSource): Promise<boolean> => {
  try {
    const migrations = await dataSource.runMigrations();
    logger.info(`Ran ${migrations.length} migrations for schema: ${dataSource.options.schema}`);
    
    return true;
  } catch (error) {
    logger.error(`Error running migrations for schema ${dataSource.options.schema}:`, error);
    return false;
  }
};

// Şema için son migrasyonu geri alma
export const revertMigration = async (dataSource: DataSource): Promise<boolean> => {
  try {
    await dataSource.undoLastMigration();
    logger.info(`Reverted last migration for schema: ${dataSource.options.schema}`);
    
    return true;
  } catch (error) {
    logger.error(`Error reverting migration for schema ${dataSource.options.schema}:`, error);
    return false;
  }
}; 